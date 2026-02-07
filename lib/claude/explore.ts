/**
 * Explore Mode Engine — Retrieval + Synthesis
 *
 * This is the core of Explore mode. It handles:
 * 1. Manual source selection (pinned sources)
 * 2. Semantic retrieval (pgvector search)
 * 3. Bucket-scoped retrieval (all sources from current bucket)
 * 4. System prompt construction
 * 5. Opus streaming
 *
 * Key design decisions:
 * - Re-retrieval on every turn (sources change as conversation evolves)
 * - Voice rules passed as params (8c determines which voice to use)
 * - Three-way deduplication: pinned → bucket → semantic
 * - Graceful degradation if embedding fails
 */

import { createClient } from '@/lib/supabase/server';
import { embedText } from '@/lib/embeddings';
import { createAnthropicClient } from './client';
import { buildExplorePrompt, SourceForPrompt, RetrievedSource } from './prompts';
import { Message, Profile } from '@/lib/types';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';

// ============================================
// Types
// ============================================

/**
 * Result returned by runExploreMode
 */
export interface ExploreResult {
  stream: MessageStream; // Anthropic MessageStream events
  retrievedSources: RetrievedSource[]; // Categorized sources for the UI source panel
}

/**
 * Parameters for running Explore mode
 */
export interface RunExploreModeParams {
  userMessage: string;
  conversationHistory: Message[];
  bucketId: string | null;
  includeAllBuckets: boolean;
  manualSourceIds: string[]; // source IDs explicitly selected by user
  apiKey: string;
  profile: Profile; // for model selection + display name only
  personalVoice: string[]; // voice rules — 8c determines which voice to use
  companyVoice: string[]; // company voice rules — 8c fetches from voice_config
}

// ============================================
// Main Function
// ============================================

/**
 * Run Explore mode: retrieve sources, build prompt, stream Opus response
 *
 * This function re-runs the full retrieval pipeline on every message, not just the first one.
 * As the conversation evolves, semantic search finds different relevant sources per turn.
 */
export async function runExploreMode(params: RunExploreModeParams): Promise<ExploreResult> {
  const {
    userMessage,
    conversationHistory,
    bucketId,
    includeAllBuckets,
    manualSourceIds,
    apiKey,
    profile,
    personalVoice,
    companyVoice,
  } = params;

  const supabase = await createClient();

  // ============================================
  // Step 1: Fetch manually pinned sources
  // ============================================

  let pinnedSources: any[] = [];
  if (manualSourceIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('id, content, source_type, source_url, bucket_id, created_at')
        .in('id', manualSourceIds);

      if (error) {
        console.warn('Failed to fetch pinned sources:', error);
      } else {
        pinnedSources = data || [];
      }
    } catch (error) {
      console.warn('Error fetching pinned sources:', error);
    }
  }

  // ============================================
  // Step 2: Embed user message
  // ============================================

  let embedding: number[] | null = null;
  try {
    embedding = await embedText(userMessage);
  } catch (error) {
    console.warn('Failed to embed user message:', error);
    // Proceed without semantic search — just use pinned + bucket sources
  }

  // ============================================
  // Step 3: Retrieve sources
  // ============================================

  // 3a. Fetch ALL sources from current bucket (if bucketId is set)
  let bucketSources: any[] = [];
  let bucketName: string | null = null;

  if (bucketId) {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('id, content, source_type, source_url, bucket_id, created_at')
        .eq('bucket_id', bucketId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch bucket sources:', error);
      } else {
        bucketSources = data || [];
      }

      // Fetch bucket name
      const { data: bucketData } = await supabase
        .from('buckets')
        .select('name')
        .eq('id', bucketId)
        .single();

      bucketName = bucketData?.name || null;
    } catch (error) {
      console.warn('Error fetching bucket sources:', error);
    }
  }

  // 3b. Semantic search across all buckets (if includeAllBuckets is true and embedding succeeded)
  let semanticResults: any[] = [];

  if (includeAllBuckets && embedding) {
    try {
      const { data, error } = await supabase.rpc('match_sources', {
        query_embedding: embedding,
        match_threshold: 0.5, // Lower threshold for V1 (few sources, want broader recall)
        match_count: 10,
      });

      if (error) {
        console.warn('Semantic search failed:', error);
      } else {
        semanticResults = data || [];
      }
    } catch (error) {
      console.warn('Error running semantic search:', error);
    }
  }

  // ============================================
  // Step 4: Deduplicate across categories
  // ============================================

  const pinnedIds = new Set(pinnedSources.map((s) => s.id));
  const bucketIds = new Set(bucketSources.map((s) => s.id));

  // Remove from bucketSources any IDs already in pinnedSources
  const deduplicatedBucketSources = bucketSources.filter((s) => !pinnedIds.has(s.id));

  // Remove from semanticResults any IDs already in pinnedSources OR bucketSources
  const deduplicatedSemanticResults = semanticResults.filter(
    (s) => !pinnedIds.has(s.id) && !bucketIds.has(s.id)
  );

  // ============================================
  // Step 5: Enrich cross-bucket sources with bucket names
  // ============================================

  // Get unique bucket IDs from semantic results + pinned sources
  const allBucketIds = new Set<string>();
  [...pinnedSources, ...deduplicatedSemanticResults].forEach((s) => {
    if (s.bucket_id) allBucketIds.add(s.bucket_id);
  });

  // Fetch bucket names in one query
  const bucketNameMap: Record<string, string> = {};
  if (allBucketIds.size > 0) {
    try {
      const { data } = await supabase
        .from('buckets')
        .select('id, name')
        .in('id', Array.from(allBucketIds));

      if (data) {
        data.forEach((bucket) => {
          bucketNameMap[bucket.id] = bucket.name;
        });
      }
    } catch (error) {
      console.warn('Error fetching bucket names:', error);
    }
  }

  // Map bucket names onto sources
  const enrichedPinnedSources = pinnedSources.map((s) => ({
    ...s,
    bucket_name: s.bucket_id ? bucketNameMap[s.bucket_id] : null,
  }));

  const enrichedSemanticSources = deduplicatedSemanticResults.map((s) => ({
    ...s,
    bucket_name: s.bucket_id ? bucketNameMap[s.bucket_id] : null,
  }));

  // ============================================
  // Step 6: Build system prompt
  // ============================================

  const systemPrompt = buildExplorePrompt({
    userName: profile.display_name,
    personalVoice,
    companyVoice,
    bucketName,
    pinnedSources: enrichedPinnedSources,
    bucketSources: deduplicatedBucketSources,
    semanticSources: enrichedSemanticSources,
  });

  // ============================================
  // Step 7: Build messages array
  // ============================================

  const messages = conversationHistory.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  // Append the new user message
  messages.push({ role: 'user', content: userMessage });

  // ============================================
  // Step 8: Call Opus with streaming
  // ============================================

  const client = createAnthropicClient(apiKey);
  const stream = client.messages.stream({
    model: profile.explore_model || 'claude-opus-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  });

  // ============================================
  // Step 9: Build categorized source metadata for UI
  // ============================================

  const retrievedSources: RetrievedSource[] = [
    // Pinned sources
    ...enrichedPinnedSources.map((s) => ({
      id: s.id,
      content: s.content.slice(0, 200), // preview only
      source_type: s.source_type,
      source_url: s.source_url,
      bucket_id: s.bucket_id,
      bucket_name: s.bucket_name || null,
      created_at: s.created_at,
      retrieval_method: 'pinned' as const,
    })),
    // Bucket sources
    ...deduplicatedBucketSources.map((s) => ({
      id: s.id,
      content: s.content.slice(0, 200),
      source_type: s.source_type,
      source_url: s.source_url,
      bucket_id: s.bucket_id,
      bucket_name: bucketName,
      created_at: s.created_at,
      retrieval_method: 'bucket' as const,
    })),
    // Semantic matches
    ...enrichedSemanticSources.map((s) => ({
      id: s.id,
      content: s.content.slice(0, 200),
      source_type: s.source_type,
      source_url: s.source_url,
      bucket_id: s.bucket_id,
      bucket_name: s.bucket_name || null,
      created_at: s.created_at,
      retrieval_method: 'semantic' as const,
      similarity: s.similarity,
    })),
  ];

  // ============================================
  // Step 10: Return stream + sources
  // ============================================

  return {
    stream,
    retrievedSources,
  };
}
