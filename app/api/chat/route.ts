import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/encryption';
import { runExploreMode, type ExploreResult } from '@/lib/claude/explore';
import { runDraftMode } from '@/lib/claude/draft';
import { extractDraft, type ExtractedDraft } from '@/lib/claude/parse';
import { generateConversationTitle } from '@/lib/claude/title';
import { type RetrievedSource } from '@/lib/claude/prompts';
import { type Profile, type Message, type Platform } from '@/lib/types';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';

export async function POST(request: Request) {
  // Step 1: Auth + validation
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    conversationId,
    message,
    mode,
    bucketId = null,
    includeAllBuckets = true,
    platform,
    manualSourceIds = [],
    voiceMode = 'personal',
  } = body;

  // Validate required fields
  if (!conversationId || !message || !mode) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (mode === 'draft' && !platform) {
    return NextResponse.json({ error: 'Platform required for Draft mode' }, { status: 400 });
  }

  // Step 2: Verify conversation ownership + fetch profile + decrypt API key
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('owner_id', user.id)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  if (!profile.anthropic_api_key_encrypted) {
    return NextResponse.json(
      { error: 'API key not configured. Go to Settings to add your Anthropic API key.' },
      { status: 400 }
    );
  }

  let apiKey: string;
  try {
    apiKey = decrypt(profile.anthropic_api_key_encrypted);
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 });
  }

  // Step 3: Resolve voice rules
  // Company voice — always fetched
  const { data: companyVoiceConfig } = await supabase
    .from('voice_config')
    .select('rules')
    .eq('type', 'company')
    .single();
  const companyVoice: string[] = companyVoiceConfig?.rules || [];

  // Personal voice — empty for Compound voice mode
  const personalVoice: string[] = voiceMode === 'compound'
    ? []
    : (profile.personal_voice_profile || []);

  // Platform voice — Draft mode only
  let platformVoice: string[] = [];
  if (mode === 'draft' && platform) {
    const { data: platformVoiceConfig } = await supabase
      .from('voice_config')
      .select('rules')
      .eq('type', 'platform')
      .eq('platform', platform)
      .single();
    platformVoice = platformVoiceConfig?.rules || [];
  }

  // Step 4: Fetch conversation history
  const { data: existingMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const conversationHistory: Message[] = existingMessages || [];

  // Step 5: Route to engine
  let engineStream: MessageStream;
  let retrievedSources: RetrievedSource[] = [];

  if (mode === 'explore') {
    const result: ExploreResult = await runExploreMode({
      userMessage: message,
      conversationHistory,
      bucketId,
      includeAllBuckets,
      manualSourceIds,
      apiKey,
      profile: profile as Profile,
      personalVoice,
      companyVoice,
    });
    engineStream = result.stream;
    retrievedSources = result.retrievedSources;
  } else {
    const result = await runDraftMode({
      userMessage: message,
      conversationHistory,
      platform: platform as Platform,
      apiKey,
      profile: profile as Profile,
      personalVoice,
      companyVoice,
      platformVoice,
    });
    engineStream = result.stream;
  }

  // Step 6: Stream as SSE
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        // [Explore only] Send sources metadata as first event
        if (mode === 'explore' && retrievedSources.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: retrievedSources })}\n\n`)
          );
        }

        // Stream text chunks from Anthropic
        let fullResponse = '';

        for await (const event of engineStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const text = event.delta.text;
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`)
            );
          }
        }

        // --- Stream complete. Now persist. ---

        // Save user message
        await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: message,
          });

        // Extract draft (Draft mode only)
        let extracted: ExtractedDraft | null = null;
        if (mode === 'draft') {
          extracted = extractDraft(fullResponse);
        }

        // Save assistant message
        const { data: assistantMsg } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: fullResponse,
            draft_content: extracted?.content || null,
          })
          .select('id')
          .single();

        // Update conversation metadata (mode, platform, updated_at)
        const conversationUpdate: Record<string, any> = {
          mode,
          updated_at: new Date().toISOString(),
        };
        if (platform) {
          conversationUpdate.platform = platform;
        }
        await supabase
          .from('conversations')
          .update(conversationUpdate)
          .eq('id', conversationId);

        // Title generation — fire-and-forget, only on first exchange
        if (conversationHistory.length === 0) {
          generateConversationTitle({
            firstUserMessage: message,
            firstAssistantResponse: fullResponse.slice(0, 500),
            apiKey,
            conversationId,
          }).catch(() => {});  // silently swallow errors
        }

        // Send done event with message ID + extracted draft
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            messageId: assistantMsg?.id || null,
            draft: extracted,
          })}\n\n`)
        );

        controller.close();
      } catch (error: any) {
        // Send error event to client
        const errorMessage = error?.message || 'An unexpected error occurred';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
