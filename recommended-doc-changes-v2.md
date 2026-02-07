# Cambrian Content Engine — Recommended Doc Changes

Based on our conversations about the vision (synthesis-first, not generation-first), the three-agent pipeline architecture, the Supabase + pgvector direction, and building a state-of-the-art but not overengineered tool, here are changes I'd make across all four docs.

---

## 1. PRD — Product Requirements Document

### 1A. Reframe the core value proposition

The PRD opens with "capture ideas → organize → draft content" which makes it sound like a fancy CMS. The actual vision you described is fundamentally different: **the AI isn't generating content, it's synthesizing YOUR ideas from fragmented contexts into polished output.** That distinction is what prevents slop.

**Add to the Overview section:**

> The content engine's core value is synthesis, not generation. The system maintains ever-growing context about both users' thoughts, conversations, readings, and ideas. When a user sits down to write, the AI draws on this accumulated context to help them find connections, refine angles, and draft content that authentically represents their thinking — not generic AI output. The goal is to compress a week-long article process into two focused hours across two evenings.

### 1B. Replace the single-model approach with a three-agent pipeline

The PRD hardcodes `claude-sonnet-4-20250514` as the default and treats the AI as one monolithic call. The actual architecture should be a **three-stage pipeline** where each stage has its own job, prompt, and model. This maps to how content actually gets created: find relevant material → figure out the angle → write it up.

**Replace Section 4 (Conversational AI) → "How it works" and "Technical implementation" with:**

> #### Three-Agent Pipeline
>
> The content engine uses three specialized agents in a pipeline. Each has a distinct job, prompt, and model. The user experiences this as one continuous conversation — the system routes to the right agent based on the phase of work.
>
> **Stage 1: Retrieval Agent**
> - **Job:** Find relevant source material across the entire system
> - **Model:** Haiku (lightweight reranking) or no model at all (pure embedding search)
> - **Trigger:** Automatically runs when the user describes what they want to write about
> - **How it works:**
>   1. Takes the user's intent ("I want to write about how PE firms measure AI ROI wrong")
>   2. Embeds the intent and performs semantic search via pgvector across ALL sources
>   3. Optionally runs BM25/keyword search for exact matches
>   4. Returns a curated, ranked set of relevant sources with similarity scores
>   5. A lightweight LLM call (Haiku) can optionally rerank and filter for quality
> - **Output:** A set of 10-30 relevant sources with relevance scores and bucket attribution
>
> **Stage 2: Synthesis Agent**
> - **Job:** Find the angle, connect dots, identify the narrative
> - **Model:** Opus (`claude-opus-4-5-20250929`) — this is where the hard thinking happens
> - **Trigger:** Runs during the brainstorming/ideation phase of conversation
> - **How it works:**
>   1. Receives the curated sources from Stage 1 + conversation history
>   2. Its system prompt explicitly says: "Your job is synthesis, not drafting. Do NOT write the article. Help the user find the angle."
>   3. Identifies connections between sources the user hasn't explicitly linked
>   4. Surfaces contrarian takes, narrative threads, and unexpected angles
>   5. Distinguishes between the user's original thoughts (voice memos, notes) and external material (articles, tweets) — prioritizes the user's voice
> - **Output:** A structured brief — thesis, supporting points with source attribution, hook, counterarguments to address. This brief becomes the input for Stage 3.
>
> **Stage 3: Drafting Agent**
> - **Job:** Write the content in the user's voice for the target platform
> - **Model:** Sonnet (`claude-sonnet-4-20250514`) — fast, cheap, good at following style rules
> - **Trigger:** When the user says "draft this" or selects a platform
> - **How it works:**
>   1. Receives the structured brief from Stage 2 + voice profiles + platform rules
>   2. Writes the content focused purely on HOW to say it, not WHAT to say (that's already decided)
>   3. Follows voice profile rules strictly
>   4. Wraps output in `<draft>` tags for the frontend to extract
> - **Output:** Platform-specific draft in the user's voice
> - **Repurposing:** Same brief from Stage 2, different platform rules → Sonnet adapts the same argument into LinkedIn, Twitter, long-form, short-form. This is how "I wrote a great article, now turn it into tweets" works — it's just Stage 3 running again.
>
> #### Conversation Mode Detection
>
> The system auto-detects which stage to route to based on the user's message:
> - **Retrieval signals:** "I want to write about...", "What do I have on...", "Find stuff related to..."
> - **Synthesis signals:** "What's the angle here?", "Help me connect these ideas", "What's the contrarian take?", brainstorming-style back-and-forth
> - **Drafting signals:** "Draft this as a...", "Write it up", "Now do a LinkedIn version", "Make the hook more provocative"
> - Users can also explicitly switch modes via a UI toggle
>
> #### Why Three Agents
>
> Each stage has a clean, testable contract. If the drafts sound off, it's a Stage 3 problem — tweak the voice profile or drafting prompt. If the angles are boring, it's Stage 2 — adjust the synthesis prompt. If irrelevant sources are being pulled in, it's Stage 1 — tune the retrieval. No more debugging one giant monolithic prompt.
>
> #### V1 Implementation
>
> For V1, these are NOT three separate infrastructure services. They are **three distinct system prompts** that the `/api/chat` route swaps between based on conversation phase. The user talks to "Claude" — the system handles routing. Formalize into truly separate agents in V2 if needed.
>
> **Technical implementation:**
> - Retrieval: pgvector semantic search + optional Haiku rerank call
> - Synthesis: Opus with synthesis-specific system prompt (no drafting allowed)
> - Drafting: Sonnet with voice profile + platform rules + structured brief from synthesis
> - Model selection is automatic based on conversation mode, but users can override in settings
> - Profile fields: `synthesis_model` (default Opus) and `drafting_model` (default Sonnet) replace the single `default_model`

### 1C. Add "Shared Context" as a first-class concept

Your vision was that context grows over time — every Wispr Flow transcript, every saved article, every conversation between you and Srikar gets added to the shared knowledge base. The PRD treats sources as static items in buckets, but the real power is in the accumulating context layer.

**Add new subsection after Source Capture:**

> ### Shared Context Layer
>
> The content engine maintains a growing shared context across both users. Every source added — whether a voice memo transcript, saved tweet, article clip, or meeting note — becomes part of the system's long-term memory.
>
> When a user starts a conversation, the system doesn't just pull sources from the current bucket. It can semantically search across ALL sources to find relevant context, even from other buckets or the inbox. This is powered by pgvector embeddings in Supabase.
>
> **How it works:**
> - Every source is embedded (via Anthropic or OpenAI embeddings API) on creation
> - When constructing the system prompt, the engine does a semantic search for sources relevant to the current conversation topic
> - Top-k relevant sources are injected into context, regardless of which bucket they live in
> - The "Include all buckets" toggle becomes the default behavior, with bucket-scoped context as the override
>
> This means: if Abhay recorded a voice memo about PE firms measuring AI ROI two weeks ago, and Srikar saved an article about the same topic yesterday, the system surfaces both when either user starts writing about it — without them having to remember which bucket those lived in.

### 1D. Add embedding infrastructure to the Data Model

**Add to the sources table:**

```sql
-- Add to sources table
embedding vector(1536), -- for semantic search via pgvector
```

**Add new index:**

```sql
-- Enable pgvector extension (run once in Supabase SQL editor)
create extension if not exists vector;

-- Add embedding index for semantic search
create index idx_sources_embedding on public.sources
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

### 1E. Update the system prompt template

The current prompt is good but doesn't reflect the synthesis-first philosophy or the semantic retrieval. 

**Update the "Your Role" section of the Claude System Prompt Template:**

Replace:
> - Help the user find angles, connections, and narratives across their source material

With:
> - Your primary job is SYNTHESIS, not generation. Help the user find unexpected connections, contrarian angles, and narrative threads across their fragmented source material. The user's own ideas and voice should always drive the content — you are refining and organizing their thinking, not replacing it.
> - When brainstorming, actively cross-reference sources from different contexts. The best content often comes from connecting ideas the user hadn't consciously linked.
> - Distinguish between the user's original thoughts (voice memos, notes) and external material (articles, tweets). Prioritize the user's voice and use external material as supporting evidence or counterpoints.

### 1F. Flip "Include all buckets" default

Based on your description of how you want this to work, cross-bucket context should be the default, not the exception. The whole point is that the system finds connections you didn't explicitly organize.

**Update Section 4 → Claude context management:**

Replace:
> By default, Claude has access to all sources in the current bucket.
> User can toggle "Include all buckets" to give Claude access to everything.

With:
> By default, Claude has access to semantically relevant sources across ALL buckets (via embedding search). The system pulls the top-k most relevant sources regardless of bucket.
> User can toggle "Bucket only" to restrict context to the current bucket (useful when sources from other topics are polluting the conversation).

---

## 2. Technical Architecture

### 2A. Add pgvector and embedding pipeline

**Add to the System Architecture diagram**, a new component:

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Next.js)                     │
│                                                          │
│  ┌──────────────┐    ┌───────────────────────────────┐  │
│  │   App Router  │    │       API Route Handlers      │  │
│  │  (React SSR   │    │                               │  │
│  │   + Client)   │◄──►│  /api/chat     → Claude API   │  │
│  │               │    │  /api/sources  → Supabase     │  │
│  │               │    │  /api/buckets  → Supabase     │  │
│  │               │    │  /api/drafts   → Supabase     │  │
│  │               │    │  /api/settings → Supabase     │  │
│  │               │    │  /api/embed    → Embeddings   │  │ ← NEW
│  └──────┬───────┘    └───────────┬───────────────────┘  │
│         │                         │                      │
└─────────┼─────────────────────────┼──────────────────────┘
          │                         │
          │                         │  + Embedding API (Voyage/OpenAI)  ← NEW
          ▼                         ▼
┌─────────────────────────────────────────────────────────┐
│                       Supabase                           │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │   Auth    │  │ Postgres │  │ Realtime │  │pgvector│ │ ← NEW
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2B. Add embedding API route

**Add new route spec:**

```
### POST /api/embed

Called automatically when a source is created or updated. Generates an embedding
and stores it in the source's `embedding` column.

Server-side flow:
1. Receive source ID
2. Fetch source content
3. Call embedding API (Voyage AI voyage-3-lite or OpenAI text-embedding-3-small)
4. Store embedding vector in the source row
5. Return success

This should also be callable as a batch operation for backfilling
existing sources.
```

### 2C. Add semantic search function

**Add to the architecture doc, new section after Draft Extraction:**

```sql
-- Semantic search function for finding relevant sources
create or replace function match_sources(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 20
)
returns table (
  id uuid,
  content text,
  source_type text,
  source_url text,
  bucket_id uuid,
  owner_id uuid,
  similarity float
)
language sql stable
as $$
  select
    sources.id,
    sources.content,
    sources.source_type,
    sources.source_url,
    sources.bucket_id,
    sources.owner_id,
    1 - (sources.embedding <=> query_embedding) as similarity
  from sources
  where 1 - (sources.embedding <=> query_embedding) > match_threshold
  order by sources.embedding <=> query_embedding
  limit match_count;
$$;
```

### 2D. Update the chat route to use the three-agent pipeline

**Replace the POST /api/chat server-side flow with a pipeline architecture:**

The current flow has one Claude call. Replace with a multi-stage pipeline:

> **Updated server-side flow for POST /api/chat:**
>
> 1. Verify auth session
> 2. Fetch + decrypt user's Anthropic API key
> 3. Fetch conversation history
> 4. **Detect conversation mode** from user message (retrieval / synthesis / drafting)
>    - Use keyword heuristics first (fast, free)
>    - Optionally: lightweight Haiku classifier call for ambiguous messages
> 5. **Route to appropriate agent:**
>
>    **If RETRIEVAL mode:**
>    - Embed the user's message via embedding API
>    - Query `match_sources()` for semantically relevant sources (top-k across all buckets)
>    - Also include all sources from the current bucket
>    - Optionally: call Haiku to rerank/filter sources for relevance
>    - Return source list to user with relevance context
>    - Store retrieved source IDs on the conversation for downstream stages
>
>    **If SYNTHESIS mode:**
>    - Fetch previously retrieved sources (from retrieval stage)
>    - Fetch voice profiles (personal + company)
>    - Construct SYNTHESIS system prompt (explicitly: "find angles, do NOT draft")
>    - Call Opus with streaming
>    - Parse response for structured brief if present (wrapped in `<brief>` tags)
>    - Store brief on conversation for downstream drafting
>
>    **If DRAFTING mode:**
>    - Fetch the structured brief from synthesis stage
>    - Fetch voice profiles (personal + company + platform)
>    - Fetch platform voice rules
>    - Construct DRAFTING system prompt (focused on voice, style, platform constraints)
>    - Call Sonnet with streaming
>    - Parse response for `<draft>` tags, save/update drafts table
>
> 6. Stream response back as SSE
> 7. Save user message + assistant message to DB
>
> **New: Add `conversation_mode` and `current_brief` fields to conversations table:**
> ```sql
> alter table conversations add column conversation_mode text default 'retrieval'
>   check (conversation_mode in ('retrieval', 'synthesis', 'drafting'));
> alter table conversations add column current_brief text; -- structured brief from synthesis stage
> alter table conversations add column retrieved_source_ids uuid[] default '{}'; -- sources from retrieval
> ```

**Add three system prompt builders to `lib/claude/prompts.ts`:**

```typescript
// Three distinct prompt builders
export function buildRetrievalRerankerPrompt(sources: Source[], userIntent: string): string
export function buildSynthesisPrompt(params: SynthesisPromptInput): string  // Opus prompt - NO drafting
export function buildDraftingPrompt(params: DraftingPromptInput): string    // Sonnet prompt - voice + platform focused
```

The synthesis prompt should include an explicit instruction:
> "You are in SYNTHESIS mode. Your job is to help the user find the angle, connect ideas, and build a narrative structure. Do NOT write the draft — that happens in the next stage. When you and the user have landed on an approach, output a structured brief wrapped in `<brief>` tags containing: thesis, key points with source attribution, recommended hook, and counterarguments to address."

The drafting prompt should include:
> "You are in DRAFTING mode. You have been given a structured brief containing the thesis, key points, and source material. Your ONLY job is to write this as compelling content that follows the voice profile and platform rules exactly. Do not second-guess the angle — focus on execution."

### 2E. Update the system prompt builder for the three-agent pipeline

**Replace the single `buildSystemPrompt` function with three specialized builders:**

The current implementation has one prompt builder that dumps all sources and tries to do everything. Replace with:

1. **`buildRetrievalRerankerPrompt()`** — Lightweight. Takes raw search results and user intent. Used only if Haiku reranking is enabled. Asks: "Which of these sources are most relevant to the user's intent? Rank them."

2. **`buildSynthesisPrompt()`** — The Opus prompt. Takes curated sources + conversation history. Explicitly forbids drafting. Focuses on finding connections, angles, narrative threads. Should instruct Claude to distinguish between the user's original thoughts and external material.

3. **`buildDraftingPrompt()`** — The Sonnet prompt. Takes the structured brief + voice profiles + platform rules. Minimal source material (just what's cited in the brief). Focused entirely on voice execution and platform formatting. This is also the prompt used for repurposing — same brief, different platform rules.

### 2F. Update profiles table

**Add to profiles schema:**

```sql
-- Replace single default_model with two model fields
synthesis_model text default 'claude-opus-4-5-20250929',
drafting_model text default 'claude-sonnet-4-20250514',
```

Remove the existing `default_model` field.

### 2G. Add embedding dependency

**Add to dependencies:**

```json
{
  "dependencies": {
    "voyageai": "^0.1"  // or "@anthropic-ai/sdk" already handles this
  }
}
```

Note: Voyage AI is Anthropic's recommended embedding provider. Alternatively, use OpenAI's `text-embedding-3-small` which is cheap and good. Either way, you need ~$0.01 per 1M tokens for embeddings — basically free.

### 2H. Add environment variable

```env
# Embeddings
VOYAGE_API_KEY=pa-...  # or OPENAI_API_KEY if using OpenAI embeddings
```

---

## 3. CLAUDE.md (Agent Instructions)

### 3A. Add the three-agent pipeline to Critical Decisions

**Add as Critical Decision #8:**

> 8. **Three-agent pipeline.** The content engine uses three specialized agents in a pipeline: Retrieval (embedding search + optional Haiku rerank), Synthesis (Opus — finds angles, does NOT draft), and Drafting (Sonnet — writes content from a structured brief). These are implemented as three distinct system prompts in `lib/claude/prompts.ts`, NOT three separate services. The `/api/chat` route detects conversation mode and routes to the right prompt + model. The user experiences one continuous conversation.

### 3B. Add embedding pipeline awareness

**Add as Critical Decision #9:**

> 9. **Sources are embedded on creation.** Every source gets an embedding vector stored via pgvector. The Retrieval Agent uses semantic search to find relevant sources across all buckets, not just the current bucket. Don't assume sources are only accessible within their bucket context.

### 3C. Add brief extraction pattern

**Add as Critical Decision #10:**

> 10. **Structured brief handoff between agents.** The Synthesis Agent outputs a structured brief wrapped in `<brief>` tags (thesis, key points, source citations, hook, counterarguments). The Drafting Agent receives this brief as input. The brief is stored on the conversation record so the user can trigger multiple drafts (different platforms) from the same brief without re-running synthesis. The frontend should display the brief in the right panel alongside draft output.

### 3D. Update "What Done Looks Like for V1"

**Add these items:**

```
- [ ] Sources are automatically embedded on creation
- [ ] Retrieval Agent: semantic search finds relevant cross-bucket sources when user describes intent
- [ ] Synthesis Agent: Opus brainstorms angles and outputs structured briefs (no drafting)
- [ ] Drafting Agent: Sonnet writes platform-specific content from structured briefs
- [ ] Conversation mode auto-detection routes to the correct agent
- [ ] Repurposing works: same brief → different platform → new draft
- [ ] Users can see which sources were pulled into a conversation's context
- [ ] Structured brief is visible in the UI and persisted for multi-platform drafting
```

### 3D. Update the Tailwind theme reference

Minor: the CLAUDE.md and PRD both reference IBM Plex Sans, but the implementation plan flags a font conflict with Die Grotesk from the Cambrian website. **Resolve this in CLAUDE.md** — pick one and be definitive. My recommendation: use Die Grotesk for headings/brand elements and IBM Plex Sans for body text, since you're already loading both from the Cambrian website.

---

## 4. Master Implementation Plan

### 4A. Add a new Task 2.5 — Embedding Infrastructure

Insert between Task 2 (Supabase Setup) and Task 3 (Auth):

> ### Task 2.5 — pgvector & Embedding Pipeline
> **Status:** NOT STARTED  
> **Dependencies:** Task 2 (Supabase must be set up)  
> **Agent type:** Builder
>
> **Objective:** Enable pgvector in Supabase, add embedding column to sources, create the semantic search function, and build the embedding API route.
>
> **Scope:**
> - Enable pgvector extension in Supabase
> - Add `embedding vector(1536)` column to sources table
> - Create `match_sources()` function
> - Build `/api/embed` route that generates and stores embeddings
> - Add embedding trigger to source creation flow (call embed API after insert)
> - Add backfill script for existing sources
>
> **Acceptance criteria:**
> - [ ] pgvector extension enabled
> - [ ] Sources table has embedding column
> - [ ] `/api/embed` generates and stores embeddings
> - [ ] `match_sources()` returns semantically relevant sources
> - [ ] New sources are automatically embedded on creation

### 4B. Rewrite Task 8 (Chat API) as the Three-Agent Pipeline

Task 8 is the most critical task and should be significantly expanded to cover the full pipeline:

**Replace Task 8 scope with:**

> ### Task 8 — Three-Agent Chat Pipeline
> **Status:** NOT STARTED
> **Dependencies:** Task 5 (API keys + voice profiles), Task 2.5 (embedding infrastructure)
> **Agent type:** Builder
>
> **Objective:** Build the server-side chat pipeline with three specialized agents: Retrieval, Synthesis, and Drafting. This is the core intelligence of the content engine.
>
> **Scope:**
>
> **8a. Conversation mode detection (`lib/claude/mode-detector.ts`):**
> - Keyword heuristic classifier that detects retrieval/synthesis/drafting intent
> - Retrieval signals: "I want to write about...", "What do I have on...", "Find stuff about..."
> - Synthesis signals: "What's the angle?", "Connect these ideas", brainstorming language
> - Drafting signals: "Draft this as...", "Write it up", "LinkedIn version", "Make the hook..."
> - Fallback: default to synthesis mode if ambiguous
> - Mode stored on conversation record, can be overridden by user
>
> **8b. Retrieval Agent (`lib/claude/agents/retrieval.ts`):**
> - Embed user's intent via embedding API
> - Query `match_sources()` for top-k semantically relevant sources across all buckets
> - Include all current-bucket sources regardless of similarity score
> - Optional: Haiku reranker call to filter/prioritize results
> - Store retrieved source IDs on conversation record
> - Return sources to frontend for display in Sources panel
>
> **8c. Synthesis Agent (`lib/claude/agents/synthesis.ts`):**
> - Build synthesis-specific system prompt via `buildSynthesisPrompt()`
> - System prompt explicitly forbids drafting
> - Instructs Opus to distinguish user's original thoughts from external material
> - Call Opus with streaming
> - Parse `<brief>` tags from response (thesis, key points, hook, counterarguments)
> - Store extracted brief on conversation record for downstream drafting
>
> **8d. Drafting Agent (`lib/claude/agents/drafting.ts`):**
> - Build drafting-specific system prompt via `buildDraftingPrompt()`
> - Takes structured brief + voice profiles + platform rules
> - Call Sonnet with streaming
> - Parse `<draft>` tags, save/update drafts table
> - Support repurposing: same brief, different platform → new draft
>
> **8e. Router (`app/api/chat/route.ts`):**
> - Orchestrates the pipeline: detect mode → route to agent → stream response
> - Handles mode transitions within a conversation (retrieval → synthesis → drafting)
> - Saves messages to DB after stream completes
>
> **Files to create/modify:**
> ```
> app/api/chat/route.ts
> lib/claude/mode-detector.ts
> lib/claude/agents/retrieval.ts
> lib/claude/agents/synthesis.ts
> lib/claude/agents/drafting.ts
> lib/claude/prompts.ts (three prompt builders)
> lib/claude/parse.ts (add brief extraction alongside draft extraction)
> app/api/conversations/route.ts
> app/api/conversations/[id]/route.ts
> ```
>
> **Acceptance criteria:**
> - [ ] Mode detection correctly classifies user messages
> - [ ] Retrieval Agent returns semantically relevant sources across all buckets
> - [ ] Synthesis Agent produces structured briefs with `<brief>` tags
> - [ ] Drafting Agent produces platform-specific drafts from briefs
> - [ ] Pipeline transitions smoothly (retrieval → synthesis → drafting)
> - [ ] Repurposing works: same brief, different platform rules → new draft
> - [ ] All three agents stream responses
> - [ ] Messages persisted to DB
> - [ ] Error handling: missing API key, invalid key, rate limits, mode detection failure

### 4C. Update Task 5 (Settings) for three-agent model config

**Add to Task 5 scope:**

> - Model selection: two dropdowns — "Synthesis model" (default Opus) and "Drafting model" (default Sonnet)
> - Replace single `default_model` field with `synthesis_model` and `drafting_model`
> - Optional: "Retrieval reranker" toggle (enable/disable Haiku reranking step)

### 4D. Update dependency graph

Task 8 (Chat Pipeline) should also depend on Task 2.5 (Embedding Infrastructure), since the Retrieval Agent needs semantic search. Task 8 is also now significantly larger and could be split into sub-tasks for parallel execution by Claude Code agents:

```
Task 2.5 (Embeddings) ──► Task 8a (Mode Detection)  ──┐
                     ──► Task 8b (Retrieval Agent)  ──┤
Task 5 (Settings)    ──► Task 8c (Synthesis Agent)  ──┼──► Task 8e (Router)
                     ──► Task 8d (Drafting Agent)   ──┘
```

Tasks 8a-8d can be built in parallel by separate Claude Code sub-agents. Task 8e (Router) integrates them all.

### 4E. Update Task 9 (Conversation UI) for pipeline awareness

**Add to Task 9 scope:**

> - Display current conversation mode indicator (Retrieval / Synthesis / Drafting) in the conversation header
> - Allow user to manually switch modes via toggle or buttons
> - Right pane should show three possible states:
>   - **During retrieval:** Show retrieved sources with relevance scores
>   - **During synthesis:** Show the structured brief as it's built
>   - **During drafting:** Show the working draft (existing behavior)
> - "Repurpose" button: when a brief exists, allow user to select a different platform and trigger Stage 3 again
> - Brief panel: display the structured brief (thesis, key points, sources) above the draft panel

### 4F. Add cost estimate context

This is useful context for you and future agents working on this:

> **Estimated monthly API costs (two active users):**
> - Opus (Synthesis Agent): ~$20-50/month (heavy context, fewer calls — only brainstorming)
> - Sonnet (Drafting Agent): ~$5-15/month (lighter context, more calls — drafting + repurposing)
> - Haiku (Retrieval reranker): ~$1-3/month (tiny calls, optional)
> - Embeddings (Voyage/OpenAI): ~$0.10/month (basically free)
> - Supabase: Free tier should cover V1
> - Vercel: Free tier should cover V1
> - **Total: ~$25-70/month in API costs**

---

## Summary of All Changes

| Doc | Change | Priority |
|-----|--------|----------|
| PRD | Reframe core value as synthesis, not generation | High |
| PRD | Three-agent pipeline (Retrieval + Synthesis + Drafting) | High |
| PRD | Shared context layer + semantic search | High |
| PRD | Add embedding column to data model | High |
| PRD | Update system prompt for synthesis-first | Medium |
| PRD | Flip "Include all buckets" default | Medium |
| Architecture | Add pgvector + embedding pipeline | High |
| Architecture | Add semantic search function | High |
| Architecture | Rewrite chat route as three-agent pipeline with mode detection | High |
| Architecture | Add three specialized system prompt builders | High |
| Architecture | Add brief extraction pattern (`<brief>` tags) | High |
| Architecture | Update profiles schema (synthesis + drafting model fields) | Medium |
| Architecture | Add conversation fields (mode, brief, retrieved source IDs) | Medium |
| Architecture | Add embedding API route spec | Medium |
| Architecture | Add env var for embedding API | Low |
| CLAUDE.md | Add critical decisions #8 (three-agent pipeline), #9 (embeddings), #10 (brief handoff) | High |
| CLAUDE.md | Update "Done" checklist for pipeline | Medium |
| CLAUDE.md | Resolve font conflict | Low |
| Impl Plan | Add Task 2.5 (Embedding Infrastructure) | High |
| Impl Plan | Rewrite Task 8 as Three-Agent Pipeline (8a-8e sub-tasks) | High |
| Impl Plan | Update Task 9 for pipeline-aware UI (mode indicator, brief panel, repurpose) | High |
| Impl Plan | Update Task 5 for three-agent model settings | Medium |
| Impl Plan | Update dependency graph (parallel sub-agents for Task 8) | Medium |
| Impl Plan | Add cost estimates | Low |
