# Task 8a — Explore Mode (Retrieval + Synthesis)

**Status:** READY
**Dependencies:** Task 2.5 (pgvector + embeddings) COMPLETE, Task 5 (voice profiles + API key) COMPLETE
**Agent type:** Builder
**Parallel with:** Task 8b (Draft Mode) — no shared files except `lib/claude/client.ts`

---

## Objective

Build the Explore mode engine: manual + semantic source retrieval, Opus system prompt construction, and streaming response. This produces clean, testable functions that Task 8c (Chat Router) will call from the `/api/chat` route.

Explore mode is where users brainstorm. Opus helps them find angles, connect ideas across their source material, and discover unexpected links — all grounded in real sources, not hallucinated takes. It does NOT write drafts (that's Draft mode).

---

## Architecture Context

```
User sends message in Explore mode
    ↓
[8c handles: auth, API key decryption, voice profile fetching, passing params]
    ↓
1. Fetch manually pinned sources (if any were selected by user before starting)
    ↓
2. Embed user message (OpenAI text-embedding-3-small)
    ↓
3. Semantic search: match_sources() → top-k from ALL buckets
   + Fetch ALL sources from current bucket
   + Deduplicate (remove bucket/pinned sources from semantic results)
    ↓
4. Categorize all sources: pinned / bucket / semantic (with metadata)
    ↓
5. Build Explore system prompt (sources + voice injected)
    ↓
6. Call Opus with streaming (full conversation history)
    ↓
7. Return raw Anthropic stream + categorized source metadata
    ↓
[8c handles: SSE formatting, message persistence, source metadata relay to client, title generation]
```

**Key decisions:**
- User explicitly selects Explore mode (no auto-detection)
- **Manual source selection supported:** Users can pin specific sources (e.g., from inbox checkboxes) before starting a conversation. These are always included, regardless of bucket or similarity.
- All current-bucket sources are included (no cap for V1)
- Cross-bucket semantic search: top 10 matches above 0.5 similarity threshold
- Full conversation history is passed to Opus (multi-turn)
- Generic system prompt — voice/worldview comes from DB, not hardcoded
- **Source visibility:** All retrieved sources are returned with rich metadata (category, similarity scores, source IDs) so the UI can show a transparent "Sources in Context" panel
- **Voice rules are passed in, not fetched internally.** 8c is responsible for determining which voice to use (based on user selection: personal / Compound) and fetching the appropriate rules. This supports the UX doc's voice selection feature — see "Voice Profile Design" section below.
- **Sources are re-retrieved on every message.** As the conversation evolves, semantic search finds different relevant sources per turn. The system prompt may change between turns. This is by design — Opus always sees the most relevant sources for the current topic.

---

## Voice Profile Design

The UX doc (see `docs/ux-improvements-conversation-flow.md`) specifies that users can select voice at conversation start:
- **Abhay (Personal)** → personal voice = Abhay's rules, company voice = Compound rules
- **Srikar (Personal)** → personal voice = Srikar's rules, company voice = Compound rules
- **Compound (Shared)** → personal voice = empty, company voice = Compound rules

To support this, `runExploreMode()` accepts `personalVoice` and `companyVoice` as direct parameters rather than fetching them internally. **8c is responsible for:**
1. Determining which voice profile to use (from conversation settings or user selection)
2. Fetching the appropriate personal voice rules (or empty array for Compound voice)
3. Fetching the company voice rules
4. Passing both to `runExploreMode()`

This keeps the engine flexible and testable — it doesn't need to know about voice selection logic.

---

## Existing Code to Build On

| File | Status | What's There |
|------|--------|-------------|
| `lib/embeddings.ts` | READY | `embedText(text)` → 1536-dim vector, `embedBatch()`, `truncateForEmbedding()` |
| `lib/encryption.ts` | READY | `encrypt()`, `decrypt()` — AES-256-GCM |
| `lib/supabase/server.ts` | READY | `createClient()` → authenticated Supabase server client |
| `lib/types.ts` | READY | All types: `Source`, `Profile`, `Conversation`, `Message`, `VoiceConfig`, `ConversationMode`, `SendMessageInput` |
| `lib/claude/prompts.ts` | STUB | Comment only: `// Explore + Draft prompt builders — implemented in Task 8` |
| `lib/claude/client.ts` | STUB | Comment only: `// Anthropic API client — implemented in Task 8` |
| `app/api/chat/route.ts` | STUB | Returns 501 — Task 8c will implement |
| `@anthropic-ai/sdk` | v0.73.0 | Installed in package.json |

**Database functions available:**
- `match_sources(query_embedding, match_threshold, match_count)` — returns `{id, content, source_type, source_url, bucket_id, owner_id, similarity}`

---

## Files to Create/Modify

### 1. `lib/claude/prompts.ts` — Explore System Prompt Builder

Replace the stub with the full implementation.

**Types to define:**

```typescript
// A source as it appears in the system prompt (content-focused)
export interface SourceForPrompt {
  id: string;
  content: string;
  source_type: string;
  source_url: string | null;
  created_at: string;
  bucket_name?: string;  // present for cross-bucket sources
}

// A source as returned to the UI (metadata-focused, for source visibility panel)
export interface RetrievedSource {
  id: string;
  content: string;       // first ~200 chars for preview
  source_type: string;
  source_url: string | null;
  bucket_id: string | null;
  bucket_name: string | null;
  created_at: string;
  retrieval_method: 'pinned' | 'bucket' | 'semantic';
  similarity?: number;   // only present for retrieval_method === 'semantic'
}

export interface ExplorePromptInput {
  userName: string;
  personalVoice: string[];
  companyVoice: string[];
  bucketName: string | null;
  pinnedSources: SourceForPrompt[];    // manually selected by user (highest priority)
  bucketSources: SourceForPrompt[];    // all sources from current bucket
  semanticSources: SourceForPrompt[];  // cross-bucket semantic matches (deduplicated)
}
```

**`buildExplorePrompt(params: ExplorePromptInput): string`**

The system prompt should follow this structure:

```
## Role
You are in EXPLORE mode. You are a content strategist working with {userName}. Your job is to help find the angle, connect ideas, and brainstorm narrative structures across their source material.

## How You Work
- Help find angles, connections, and narratives across source material
- Identify contrarian takes, surprising connections, and strong theses
- Reference specific sources when building arguments — quote or paraphrase so the user knows what material you're drawing from
- Distinguish between the user's ORIGINAL thoughts (notes, voice memos) and EXTERNAL material (articles, tweets, podcast notes, article clips). Prioritize the user's voice — their ideas should drive the content
- Be direct and collaborative — this is a working session, not a formal interaction
- Do NOT write full drafts. That happens in Draft mode. You can sketch rough outlines or suggest structures, but stop short of polished prose

## Company Voice
{company voice rules, bulleted}

## {userName}'s Personal Voice
{personal voice rules, bulleted}

## Pinned Sources (User-Selected)
{Manually selected sources — the user specifically chose these as relevant. Pay special attention to them.}

## Source Material — "{bucketName}"
{All bucket sources, formatted with type labels, dates, URLs}

## Additional Sources (Other Buckets)
{Semantic matches from other buckets, with bucket name labels}
```

**Source formatting requirements:**
- Each source gets a type label: `[note]`, `[voice_memo]`, `[link]`, `[tweet]`, `[article_clip]`, `[podcast_note]`
- Include created_at date for temporal context
- Include source_url when present (for links, tweets)
- For cross-bucket sources, prefix with `[From: {bucket_name}]`
- Use `---` dividers between sources for readability
- **Pinned sources get their own section** with a note: "The user specifically selected these sources as relevant to this conversation."
- If a pinned source is also a bucket source, show it in the Pinned section only (don't duplicate)
- If no company voice rules are set, say "No company voice rules configured yet."
- If no personal voice rules are set, say "No personal voice rules configured yet."
- If no bucket (freestanding conversation), omit the "Source Material" section header
- If no pinned sources, omit the "Pinned Sources" section entirely
- If no semantic matches (or includeAllBuckets is false), omit the "Additional Sources" section

---

### 2. `lib/claude/client.ts` — Anthropic Client Helper

Replace the stub. This file is shared between Task 8a and 8b.

```typescript
import Anthropic from '@anthropic-ai/sdk';

export function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}
```

Keep it simple. Both Explore and Draft modes will use this to initialize the client.

---

### 3. `lib/claude/explore.ts` — Explore Mode Engine (NEW FILE)

This is the core deliverable. A single function that handles the entire Explore pipeline.

**Function signature:**

```typescript
import { Message, Profile } from '@/lib/types';
import { RetrievedSource } from './prompts';

export interface ExploreResult {
  stream: AsyncIterable<any>;           // Anthropic MessageStream events
  retrievedSources: RetrievedSource[];  // Categorized sources for the UI source panel
}

export async function runExploreMode(params: {
  userMessage: string;
  conversationHistory: Message[];
  bucketId: string | null;
  includeAllBuckets: boolean;
  manualSourceIds: string[];  // source IDs explicitly selected by user (e.g., from inbox checkboxes)
  apiKey: string;
  profile: Profile;           // for model selection + display name only
  personalVoice: string[];    // voice rules — 8c determines which voice to use
  companyVoice: string[];     // company voice rules — 8c fetches from voice_config
}): Promise<ExploreResult>
```

**Why voice rules are passed in (not fetched internally):** The UX doc specifies users can select voice at conversation start (Abhay / Srikar / Compound). "Compound" voice means empty personal rules + company rules. 8c determines which voice to use based on conversation settings and passes the appropriate rules. This keeps `runExploreMode` focused on retrieval + prompting + streaming.

**Implementation steps inside `runExploreMode()`:**

**Step 1: Fetch manually pinned sources**

If `manualSourceIds` is non-empty, fetch those specific sources:
```typescript
const supabase = await createClient();

let pinnedSources: Source[] = [];
if (manualSourceIds.length > 0) {
  const { data } = await supabase
    .from('sources')
    .select('id, content, source_type, source_url, bucket_id, created_at')
    .in('id', manualSourceIds);
  pinnedSources = data || [];
}
```

These are always included regardless of bucket or similarity. They represent the user's explicit intent: "I want to think about THESE."

**Step 2: Embed user message**
```typescript
import { embedText } from '@/lib/embeddings';
const embedding = await embedText(userMessage);
```

**Step 3: Retrieve sources**

a) If `bucketId` is set, fetch ALL sources from that bucket:
```typescript
const { data: bucketSources } = await supabase
  .from('sources')
  .select('id, content, source_type, source_url, bucket_id, created_at')
  .eq('bucket_id', bucketId)
  .order('created_at', { ascending: false });
```

b) If `includeAllBuckets` is true (default), run semantic search:
```typescript
const { data: semanticResults } = await supabase
  .rpc('match_sources', {
    query_embedding: embedding,
    match_threshold: 0.5,   // lower for V1 (few sources, want broader recall)
    match_count: 10
  });
```

c) **Deduplicate across all three categories:**
- Remove from `bucketSources` any IDs already in `pinnedSources`
- Remove from `semanticResults` any IDs already in `pinnedSources` OR `bucketSources`
- This ensures no source appears twice in the prompt

d) Enrich cross-bucket sources with bucket names:
```typescript
// Get unique bucket_ids from semantic results + pinned sources
// Fetch bucket names in one query
// Map bucket_id → bucket.name onto each source
```

**Step 4: Fetch bucket name** (if bucketId set)
```typescript
const { data: bucket } = await supabase
  .from('buckets')
  .select('name')
  .eq('id', bucketId)
  .single();
```

**Step 5: Build system prompt**
```typescript
import { buildExplorePrompt } from './prompts';

const systemPrompt = buildExplorePrompt({
  userName: profile.display_name,
  personalVoice,   // passed in by 8c (not from profile)
  companyVoice,     // passed in by 8c (not fetched from DB)
  bucketName: bucket?.name || null,
  pinnedSources: formatForPrompt(pinnedSources),
  bucketSources: formatForPrompt(deduplicatedBucketSources),
  semanticSources: formatForPrompt(deduplicatedSemanticResults),
});
```

**Step 6: Build messages array**

Convert conversation history to Anthropic format:
```typescript
const messages = conversationHistory.map(msg => ({
  role: msg.role as 'user' | 'assistant',
  content: msg.content,
}));

// Append the new user message
messages.push({ role: 'user', content: userMessage });
```

**Step 7: Call Opus with streaming**
```typescript
import { createAnthropicClient } from './client';

const client = createAnthropicClient(apiKey);
const stream = client.messages.stream({
  model: profile.explore_model || 'claude-opus-4-5-20250929',
  max_tokens: 4096,
  system: systemPrompt,
  messages,
});
```

**Step 8: Build categorized source metadata for UI**

```typescript
const retrievedSources: RetrievedSource[] = [
  ...pinnedSources.map(s => ({
    id: s.id,
    content: s.content.slice(0, 200),  // preview only
    source_type: s.source_type,
    source_url: s.source_url,
    bucket_id: s.bucket_id,
    bucket_name: bucketNameMap[s.bucket_id] || null,
    created_at: s.created_at,
    retrieval_method: 'pinned' as const,
  })),
  ...deduplicatedBucketSources.map(s => ({
    id: s.id,
    content: s.content.slice(0, 200),
    source_type: s.source_type,
    source_url: s.source_url,
    bucket_id: s.bucket_id,
    bucket_name: bucket?.name || null,
    created_at: s.created_at,
    retrieval_method: 'bucket' as const,
  })),
  ...deduplicatedSemanticResults.map(s => ({
    id: s.id,
    content: s.content.slice(0, 200),
    source_type: s.source_type,
    source_url: s.source_url,
    bucket_id: s.bucket_id,
    bucket_name: bucketNameMap[s.bucket_id] || null,
    created_at: s.created_at,
    retrieval_method: 'semantic' as const,
    similarity: s.similarity,
  })),
];
```

**Step 9: Return stream + sources**
```typescript
return {
  stream,              // Raw Anthropic MessageStream — 8c converts to SSE
  retrievedSources,    // Categorized sources for UI source visibility panel
};
```

---

### 4. `lib/claude/title.ts` — Auto-Title Generation (NEW FILE)

Fire-and-forget title generation after the first exchange in ANY mode (Explore or Draft).

```typescript
export async function generateConversationTitle(params: {
  firstUserMessage: string;
  firstAssistantResponse: string;  // first ~500 chars
  apiKey: string;
  conversationId: string;
}): Promise<void>
```

**Implementation:**
1. Create Anthropic client with the user's API key
2. Call **Haiku** (`claude-haiku-4-5-20251001`) — cheap and fast:
   ```
   prompt: "Generate a concise 3-6 word title for this conversation.

   User's message: {firstUserMessage}
   Assistant's response: {first 500 chars of response}

   Return ONLY the title, nothing else. No quotes, no punctuation unless part of the title."
   ```
3. Update conversations table: `supabase.from('conversations').update({ title }).eq('id', conversationId)`
4. This is called fire-and-forget from 8c after the first exchange in ANY mode — do NOT block the main response stream
5. Wrap in try/catch — if title generation fails, the conversation just keeps its null title (no big deal)

**Note:** Although this file lives in 8a's scope, 8c calls it for both Explore and Draft conversations. The function is mode-agnostic — it just generates a title from the first message exchange.

---

## Important: Per-Turn Re-Retrieval

`runExploreMode()` re-runs the full retrieval pipeline on **every message**, not just the first one. This means:

- **Turn 1:** User asks about "AI regulation" → semantic search finds regulation sources
- **Turn 2:** User pivots to "Jevons paradox angle" → semantic search finds different sources
- **The system prompt changes between turns** (different sources injected each time)

This is by design — as the conversation evolves, Opus should always see the most relevant sources for the current topic. However, this means:

- Prior assistant responses may reference sources that are no longer in the current system prompt
- This is fine — the references are in the conversation history, and Opus can still discuss them
- Supabase calls (embedding + match_sources + bucket query) happen on every turn — acceptable for V1 scale

---

## Error Handling

`runExploreMode()` should handle these errors gracefully:

| Error | Handling |
|-------|----------|
| Manual source fetch fails | Proceed without pinned sources. Log warning. |
| Embedding fails (OpenAI error) | Proceed without semantic search — just use pinned + bucket sources. Log warning. |
| match_sources() returns empty | Normal — just use pinned + bucket sources. No error. |
| No sources at all (no pinned, bucket empty, no semantic matches) | Still call Opus — the prompt says "No sources" and Opus can still brainstorm based on the user's message alone. |
| Anthropic API error (invalid key, rate limit) | Throw — let 8c handle and return appropriate HTTP error to client. |

---

## Acceptance Criteria

**Retrieval pipeline:**
- [ ] Fetches manually pinned sources by ID (always included, highest priority)
- [ ] Embeds user message via `embedText()` → calls `match_sources()` RPC
- [ ] Includes ALL current-bucket sources (no cap)
- [ ] Cross-bucket semantic search: top 10 matches above 0.5 similarity threshold
- [ ] Three-way deduplication: pinned → bucket → semantic (no source appears twice)
- [ ] Cross-bucket sources enriched with bucket names
- [ ] `includeAllBuckets=false` skips semantic search (pinned + bucket sources only)
- [ ] `manualSourceIds=[]` (empty) skips pinned source fetch gracefully
- [ ] Re-retrieval runs on every message (not cached from first turn)

**System prompt:**
- [ ] `buildExplorePrompt()` produces well-structured prompt with voice profiles and sources
- [ ] Pinned sources get their own section with explicit "user selected these" framing
- [ ] Prompt distinguishes user's original thoughts (note, voice_memo) from external material (link, tweet, article_clip, podcast_note)
- [ ] Freestanding conversations (no bucket) handled gracefully — omit bucket section

**Streaming:**
- [ ] Calls Opus with streaming via `client.messages.stream()`
- [ ] Uses `profile.explore_model` (falls back to `claude-opus-4-5-20250929`)
- [ ] Returns raw Anthropic MessageStream

**Source visibility metadata:**
- [ ] Returns `RetrievedSource[]` with every source categorized as `pinned`, `bucket`, or `semantic`
- [ ] Semantic sources include `similarity` score
- [ ] All sources include `bucket_name` for cross-bucket attribution
- [ ] Content truncated to ~200 chars for preview (full content is in the prompt, not re-sent to UI)

**Voice flexibility:**
- [ ] Accepts `personalVoice` and `companyVoice` as direct params (does NOT fetch voices internally)
- [ ] Works correctly when personalVoice is empty (Compound voice scenario)

**Infrastructure:**
- [ ] `createAnthropicClient()` helper works with decrypted API key
- [ ] `generateConversationTitle()` calls Haiku, updates DB, is fire-and-forget, works for any mode
- [ ] Graceful degradation: embedding failure → proceed without semantic search
- [ ] No TypeScript errors, no lint errors
- [ ] Functions are clean — 8c can call `runExploreMode()` and get a stream back without knowing internals

---

## What This Task Does NOT Do

- **NOT the /api/chat route** — that's Task 8c (Chat Router)
- **NOT message persistence** — 8c saves user + assistant messages to DB
- **NOT SSE formatting** — 8c converts the Anthropic stream to SSE for the client
- **NOT auth verification or API key decryption** — 8c handles auth + passes decrypted key
- **NOT voice profile fetching** — 8c fetches voices based on user selection and passes rules as params
- **NOT draft parsing** — that's Task 8b (`extractDraft()`, `stripDraftTags()`)
- **NOT the conversation UI** — that's Task 9
- **NOT the inbox checkbox UI** — that's Task 9; this task just accepts `manualSourceIds` as input
- **NOT source persistence** — sources in context are returned as metadata, not saved to a separate table (V1 keeps it lightweight; a `conversation_sources` junction table can be added in V2 if needed)

---

## Reference Files

Read these before starting:

| File | What to look for |
|------|-----------------|
| `technical-architecture-and-database-schema.md` lines 486-585 | System prompt construction — `buildExplorePrompt` template |
| `technical-architecture-and-database-schema.md` lines 296-395 | POST /api/chat flow — understand how 8c will call your code |
| `technical-architecture-and-database-schema.md` lines 627-661 | `match_sources()` SQL function signature |
| `docs/ux-improvements-conversation-flow.md` | UX patterns — source visibility, manual selection, voice selection, conversation entry points |
| `lib/embeddings.ts` | Embedding functions you'll call |
| `lib/types.ts` | All type definitions — use these, don't redefine |
| `lib/supabase/server.ts` | Server Supabase client you'll use for source queries |
| `claude-code-agent-instructions.md` | Coding conventions, file patterns |

---

## Testing Strategy

Since this task produces library functions (not an API route), testing happens when 8c integrates. However, ensure:

1. Each function is independently importable and has clear inputs/outputs
2. Type safety: all params and returns are fully typed
3. `buildExplorePrompt()` is a pure function — can be tested with mock inputs
4. The builder can manually verify by importing and calling functions in a test script if desired

After 8c is complete, the full pipeline can be tested: send a message → get streamed Opus response with source context.
