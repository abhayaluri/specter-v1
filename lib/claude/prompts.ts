/**
 * Prompt Builders for Explore and Draft Modes
 *
 * These functions construct system prompts for Claude:
 * - buildExplorePrompt: Opus — retrieval + synthesis (brainstorm angles)
 * - buildDraftPrompt: Sonnet — voice + platform + conversation context (implemented in Task 8b)
 */

// ============================================
// Types
// ============================================

/**
 * A source as it appears in the system prompt (content-focused)
 */
export interface SourceForPrompt {
  id: string;
  content: string;
  source_type: string;
  source_url: string | null;
  created_at: string;
  bucket_name?: string; // present for cross-bucket sources
}

/**
 * A source as returned to the UI (metadata-focused, for source visibility panel)
 */
export interface RetrievedSource {
  id: string;
  content: string; // first ~200 chars for preview
  source_type: string;
  source_url: string | null;
  bucket_id: string | null;
  bucket_name: string | null;
  created_at: string;
  retrieval_method: 'pinned' | 'bucket' | 'semantic';
  similarity?: number; // only present for retrieval_method === 'semantic'
}

/**
 * Input parameters for building the Explore system prompt
 */
export interface ExplorePromptInput {
  userName: string;
  personalVoice: string[];
  companyVoice: string[];
  bucketName: string | null;
  pinnedSources: SourceForPrompt[]; // manually selected by user (highest priority)
  bucketSources: SourceForPrompt[]; // all sources from current bucket
  semanticSources: SourceForPrompt[]; // cross-bucket semantic matches (deduplicated)
}

// ============================================
// Explore Prompt Builder
// ============================================

/**
 * Build the system prompt for Explore mode (Opus)
 *
 * Explore mode helps users find angles, connect ideas, and brainstorm narrative
 * structures across their source material. It does NOT write full drafts.
 */
export function buildExplorePrompt(params: ExplorePromptInput): string {
  const {
    userName,
    personalVoice,
    companyVoice,
    bucketName,
    pinnedSources,
    bucketSources,
    semanticSources,
  } = params;

  let prompt = `## Role
You are in EXPLORE mode. You are a content strategist working with ${userName}. Your job is to help find the angle, connect ideas, and brainstorm narrative structures across their source material.

## How You Work
- Help find angles, connections, and narratives across source material
- Identify contrarian takes, surprising connections, and strong theses
- Reference specific sources when building arguments — quote or paraphrase so the user knows what material you're drawing from
- Distinguish between the user's ORIGINAL thoughts (notes, voice memos) and EXTERNAL material (articles, tweets, podcast notes, article clips). Prioritize the user's voice — their ideas should drive the content
- Be direct and collaborative — this is a working session, not a formal interaction
- Do NOT write full drafts. That happens in Draft mode. You can sketch rough outlines or suggest structures, but stop short of polished prose

## Company Voice
${companyVoice.length > 0 ? companyVoice.map((r) => `- ${r}`).join('\n') : 'No company voice rules configured yet.'}

## ${userName}'s Personal Voice
${personalVoice.length > 0 ? personalVoice.map((r) => `- ${r}`).join('\n') : 'No personal voice rules configured yet.'}`;

  // Pinned sources section (only if sources exist)
  if (pinnedSources.length > 0) {
    prompt += `\n\n## Pinned Sources (User-Selected)
The user specifically selected these sources as relevant to this conversation. Pay special attention to them.

`;
    pinnedSources.forEach((source) => {
      prompt += formatSource(source);
    });
  }

  // Bucket sources section (only if bucket is set)
  if (bucketName) {
    prompt += `\n\n## Source Material — "${bucketName}"
`;
    if (bucketSources.length > 0) {
      bucketSources.forEach((source) => {
        prompt += formatSource(source);
      });
    } else {
      prompt += 'No sources in this bucket yet.\n';
    }
  }

  // Semantic matches from other buckets
  if (semanticSources.length > 0) {
    prompt += `\n\n## Additional Sources (Other Buckets)
`;
    semanticSources.forEach((source) => {
      prompt += formatSource(source, true);
    });
  }

  return prompt;
}

/**
 * Format a single source for inclusion in the system prompt
 */
function formatSource(source: SourceForPrompt, includeBucketLabel = false): string {
  let output = '---\n';

  // Bucket label for cross-bucket sources
  if (includeBucketLabel && source.bucket_name) {
    output += `[From: ${source.bucket_name}] `;
  }

  // Type label and date
  output += `[${source.source_type}] (${new Date(source.created_at).toLocaleDateString()})\n`;

  // Content
  output += `${source.content}\n`;

  // URL if present
  if (source.source_url) {
    output += `URL: ${source.source_url}\n`;
  }

  output += '---\n\n';

  return output;
}
