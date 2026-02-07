/**
 * Draft Mode Engine
 *
 * Platform-specific content writing with voice profile enforcement.
 * Sonnet takes full conversation context (including Explore discussion),
 * applies voice profiles and platform constraints, and produces polished
 * content wrapped in <draft> tags.
 */

import { createAnthropicClient } from './client';
import { Platform, Message, Profile } from '@/lib/types';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';

// ============================================
// Types
// ============================================

export interface DraftPromptInput {
  userName: string;
  personalVoice: string[];
  companyVoice: string[];
  platformVoice: string[];
  platform: Platform;
}

export interface DraftResult {
  stream: MessageStream; // Anthropic MessageStream events
}

// ============================================
// Prompt Builder
// ============================================

/**
 * Build the Draft mode system prompt
 *
 * Constructs a prompt that:
 * - Instructs Sonnet to write platform-specific content
 * - Applies company, personal, and platform voice rules
 * - Enforces <draft> tag format for content extraction
 * - Acknowledges prior Explore discussion in conversation history
 */
export function buildDraftPrompt(params: DraftPromptInput): string {
  const { userName, personalVoice, companyVoice, platformVoice, platform } = params;

  // Format voice rules or fallback to "not configured" message
  const companyVoiceSection = companyVoice.length > 0
    ? companyVoice.map(rule => `- ${rule}`).join('\n')
    : 'No company voice rules configured yet.';

  const personalVoiceSection = personalVoice.length > 0
    ? personalVoice.map(rule => `- ${rule}`).join('\n')
    : 'No personal voice rules configured yet.';

  const platformVoiceSection = platformVoice.length > 0
    ? platformVoice.map(rule => `- ${rule}`).join('\n')
    : 'No platform-specific rules configured yet.';

  return `## Role
You are in DRAFT mode. Your job is to write compelling platform-specific content. Follow the voice profile and platform rules strictly.

## How You Work
- Write content based on the conversation so far. The conversation may include prior Explore-mode discussion where ideas, angles, and source material were discussed — build on that context.
- Follow the voice profile rules strictly — these define the writing style.
- When producing or updating a draft, ALWAYS wrap it in <draft> tags (see Draft Format below). This is how the application extracts your draft content.
- Be direct and collaborative — explain your creative choices briefly, and ask for feedback after presenting the draft.
- When the user asks for revisions, produce a complete updated draft (not just the changed parts). Always wrap the full updated draft in <draft> tags.
- When the user asks to adapt for a different platform, write a fresh draft following that platform's rules.

## Company Voice
${companyVoiceSection}

## ${userName}'s Personal Voice
${personalVoiceSection}

## Platform: ${platform}
${platformVoiceSection}

## Draft Format
When you produce or update a draft, wrap it in these exact delimiters:

<draft platform="${platform}" title="{title}">
[Your draft content in markdown]
</draft>

Rules:
- ALWAYS include these delimiters when producing or updating draft content
- The platform attribute should match the current platform (${platform})
- The title should be a short, descriptive title for the draft
- Continue your conversational response OUTSIDE the delimiters
- You can include commentary before or after the draft explaining your choices or asking for feedback
- When revising, produce the COMPLETE updated draft, not just changes`;
}

// ============================================
// Draft Mode Engine
// ============================================

/**
 * Run Draft mode
 *
 * Takes conversation context + voice profiles + platform rules,
 * and streams Sonnet's writing response with <draft> tags.
 *
 * @param params - Draft mode parameters
 * @returns Promise resolving to Anthropic stream
 */
export async function runDraftMode(params: {
  userMessage: string;
  conversationHistory: Message[];
  platform: Platform;
  apiKey: string;
  profile: Profile;
  personalVoice: string[];
  companyVoice: string[];
  platformVoice: string[];
}): Promise<DraftResult> {
  const {
    userMessage,
    conversationHistory,
    platform,
    apiKey,
    profile,
    personalVoice,
    companyVoice,
    platformVoice,
  } = params;

  // Step 1: Build system prompt
  const systemPrompt = buildDraftPrompt({
    userName: profile.display_name,
    personalVoice,
    companyVoice,
    platformVoice,
    platform,
  });

  // Step 2: Build messages array
  // Pass ALL conversation messages (Explore + Draft eras) plus the new user message
  const messages = conversationHistory.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  // Append the new user message
  messages.push({ role: 'user', content: userMessage });

  // Step 3: Call Sonnet with streaming
  const client = createAnthropicClient(apiKey);
  const stream = client.messages.stream({
    model: profile.draft_model || 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  // Step 4: Return stream
  return { stream };
}
