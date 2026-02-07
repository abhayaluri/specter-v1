# Cambrian Content Engine — Product Requirements Document

## Overview

A content engine for Abhay and Srikar (Compound / Cambrian Explorations) to capture ideas from multiple sources, organize them into thematic buckets, and use conversational AI to brainstorm, synthesize, and draft content for LinkedIn, Twitter/X, long-form, and short-form publishing.

The content engine's core value is synthesis, not generation. The system maintains ever-growing context about both users' thoughts, conversations, readings, and ideas. When a user sits down to write, the AI draws on this accumulated context to help them find connections, refine angles, and draft content that authentically represents their thinking — not generic AI output. The goal is to compress a week-long article process into two focused hours across two evenings.

**Users:** Abhay and Srikar (2 users, private tool)
**Timeline:** Weekend V1 — ship something usable in 2-3 days
**Stack:** Next.js 14 (App Router) + Supabase (auth, Postgres, realtime) + Anthropic Claude API
**Deployment:** Vercel
**Dev tool:** Claude Code

---

## Core Concepts

### Mental Model

```
Sources (raw material) → Buckets (thematic clusters) → Chat with Claude (brainstorm + refine) → Drafts (platform-specific output)
```

### Key Entities

- **User** — Abhay or Srikar. Each has their own API key, voice profile, and inbox.
- **Bucket** — A thematic idea cluster (e.g., "Jevons & Abundance Mindset," "SaaS Build vs Buy"). Flat list for V1, no nested project hierarchy. Buckets belong to a user but can be viewed by both users.
- **Source** — An atomic piece of content: a note, quote, URL, voice memo transcript, observation. Sources live in a bucket or in the user's inbox (unsorted).
- **Conversation** — A chat thread with Claude, tied to a bucket (or freestanding). This is where brainstorming and draft refinement happen. The conversation has full context of the bucket's sources, the user's voice profile, and (optionally) sources from other buckets.
- **Draft** — A piece of content generated through conversation, tied to a platform (LinkedIn, Twitter/X, long-form, short-form). Drafts have a status: `draft` → `ready` → `published`. Drafts are editable and support copy-to-clipboard.
- **Voice Profile** — Writing style rules. Each user has a personal voice profile. There is also a shared "Compound" company voice profile. Voice profiles are injected into Claude's system prompt during conversations.

---

## V1 Feature Scope

### 1. Authentication & User Setup

- Supabase Auth with email/password (just 2 accounts — Abhay and Srikar)
- Settings page where each user can:
  - Enter and save their Anthropic API key (encrypted at rest in Supabase)
  - Edit their personal voice profile (list of rules, free text)
  - Edit the shared company voice profile
- Simple top-nav showing logged-in user with avatar/initial

### 2. Source Capture

**Inbox:** Each user has a personal inbox where unsorted sources land.

**Capture modal** (triggered by global `+ Capture` button or keyboard shortcut `Cmd+K`):
- **Text/Note:** Free text input for typed notes, quotes, observations, copy-pasted Wispr Flow transcripts
- **URL/Link:** Paste a URL with optional annotation text. V1 stores the URL and annotation as plain text (no auto-fetching). Future: auto-fetch page content.
- **Source type tags:** `note`, `link`, `voice_memo`, `podcast_note`, `article_clip`, `tweet` — user selects from dropdown
- **Destination:** Drop into inbox (default) or directly into a specific bucket
- Timestamps auto-generated

**Bulk paste:** For V1, support pasting multiple lines that get split into individual sources (one per paragraph/line break). Useful for dumping a batch of notes at once.

### Shared Context Layer

The content engine maintains a growing shared context across both users. Every source added — whether a voice memo transcript, saved tweet, article clip, or meeting note — becomes part of the system's long-term memory.

When a user starts a conversation, the system doesn't just pull sources from the current bucket. It semantically searches across ALL sources to find relevant context, even from other buckets or the inbox. This is powered by pgvector embeddings in Supabase.

**How it works:**
- Every source is embedded (via OpenAI embeddings API) on creation
- When constructing the system prompt, the engine does a semantic search for sources relevant to the current conversation topic
- Top-k relevant sources are injected into context, regardless of which bucket they live in
- The "Include all buckets" toggle becomes the default behavior, with bucket-scoped context as the override

This means: if Abhay recorded a voice memo about PE firms measuring AI ROI two weeks ago, and Srikar saved an article about the same topic yesterday, the system surfaces both when either user starts writing about it — without them having to remember which bucket those lived in.

### 3. Bucket Management

- Create, rename, delete, reorder buckets
- Each bucket has a name, color (auto-assigned from palette, editable), and description (optional)
- Bucket list view shows: name, color, source count, draft count, preview of latest source
- Click into a bucket to see all its sources and drafts
- Move sources between buckets (drag-and-drop or dropdown action)
- Move sources from inbox to bucket (one-click suggested sort or manual)

**Visibility:** Both users can see all buckets. Buckets have an `owner` (creator) but are visible workspace-wide. V1 does not need per-bucket permissions.

### 4. Conversational AI (The Core Feature)

This is the primary interface for content creation. It is NOT a one-shot "generate draft" button — it's a conversation.

**Layout:** Split-pane view.
- **Left pane:** The conversation thread (chat messages between user and Claude)
- **Right pane:** The "working draft" — a live document that Claude updates as you converse. Also shows source material panel (collapsible).

**How it works:**

1. User opens a conversation from within a bucket (or from scratch).
2. Claude is initialized with a system prompt containing:
   - The user's personal voice profile rules
   - The shared company voice profile rules
   - Platform-specific voice guidance (if a platform is selected)
   - All sources in the current bucket (full text)
   - Optionally: sources from other buckets the user has explicitly included
3. User can:
   - Brainstorm: "I want to write about how PE firms are measuring AI ROI wrong. Help me find an angle."
   - Claude responds conversationally, referencing specific sources from the bucket context.
   - Request a draft: "OK, let's draft this as a LinkedIn post."
   - Claude generates a draft, which appears in the right pane.
   - Refine: "Make the opening hook more provocative" / "Weave in the Jevons example" / "Cut the second paragraph, it's too academic"
   - Claude updates the draft in the right pane.
   - Switch platforms: "Now adapt this for a Twitter thread"
4. The conversation persists — user can come back to it later.

**Claude context management:**
- By default, Claude has access to semantically relevant sources across ALL buckets (via embedding search). The system pulls the top-k most relevant sources regardless of bucket.
- User can toggle "Bucket only" to restrict context to the current bucket (useful when sources from other topics are polluting the conversation).
- The system prompt should instruct Claude to reference specific sources by quoting them when relevant, so the user knows what material is being synthesized.
- Claude should be instructed to follow the voice profile rules strictly.

**Draft behavior:**
- The right-pane draft is a rendered markdown document.
- Each time Claude produces a new draft version in the conversation, the right pane updates.
- Claude should wrap draft content in a specific format (e.g., markdown code block with a `draft` tag or similar delimiter) so the frontend can parse and extract it from the conversational response.
- Previous draft versions are preserved (simple version list — "v1", "v2", etc.).

**Technical implementation:**
- Use the Anthropic API (Messages endpoint) with the user's API key stored in their settings.
- Stream responses for real-time feel.
- Conversation history is stored in Supabase (messages table tied to conversation ID).
- System prompt is constructed dynamically from voice profiles + bucket sources.
- **Two explicit modes (user selects, no auto-detection):**
  - **Explore Mode** (Opus `claude-opus-4-5-20250929`): Combines retrieval (pgvector semantic search across all sources) with synthesis (finding angles, connecting dots, brainstorming). From the user's perspective, "find relevant stuff" and "help me figure out the angle" are one intent. Retrieval happens automatically under the hood.
  - **Draft Mode** (Sonnet `claude-sonnet-4-20250514`): Writes platform-specific content based on the full Explore conversation context + voice profiles + platform rules. No structured brief — the full conversation history is passed as context. Also handles repurposing — same Explore conversation, switch platform, hit Draft again → new draft.
  - **Edit:** Not a separate AI mode — just an editable textarea on the draft for the user's "last 30%" refinement.
  - The user explicitly selects Explore or Draft mode (like Cursor's Plan/Chat/Edit modes). No auto mode detection.
  - Profile fields: `explore_model` (default Opus) and `draft_model` (default Sonnet).
  - For V1, these are two distinct system prompts that the `/api/chat` route swaps between, NOT separate services.

### 5. Draft Management

- Drafts are created through conversations (not independently).
- Each draft has: title, platform (linkedin / twitter / longform / shortform), status (`draft` / `ready` / `published`), content (markdown), version history, linked conversation, linked bucket.
- Draft list view: filter by platform, status, bucket.
- Draft detail view: rendered markdown with copy-to-clipboard button.
- Edit draft content directly (markdown editor) outside of conversation.
- Status transitions: user manually marks as `ready` or `published`.

### 6. Dashboard

- Overview showing: total sources, active drafts by status, recent activity across both users.
- Quick links to each bucket with source/draft counts.
- Inbox count with link to inbox.
- Recent conversations list.

### 7. Voice Profiles

- **Personal voice profile** (per user): A list of writing rules/guidelines (free text, one rule per line). Examples from Srikar's prototype:
  - "Uses real operator examples, never abstract hypotheticals"
  - "Bold, direct statements — irreverent in titles and hooks"
  - "Short paragraphs, 2-3 sentences max"
- **Company voice profile** (shared): Rules that apply to all content regardless of author.
- **Platform voice modes** (shared): Per-platform guidance that supplements the personal and company profiles:
  - LinkedIn: "Professional, insight-driven. 1300 character max for preview. Hook in first line."
  - Twitter/X: "Punchy, provocative. 280 char per tweet. Thread format for longer takes."
  - Long-form: "Narrative depth, 2-4k words. Section headers. Storytelling arc."
  - Short-form: "Tight argument, 500-1k words. One core thesis."
- All profiles are editable through a settings/profile page.
- Profiles are injected into the Claude system prompt during conversations.

---

## Data Model (Supabase Postgres)

```sql
-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  display_name text not null,
  avatar_url text,
  anthropic_api_key_encrypted text, -- encrypted before storage
  personal_voice_profile text[], -- array of rules
  explore_model text default 'claude-opus-4-5-20250929',
  draft_model text default 'claude-sonnet-4-20250514',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Shared voice config (company + platform voices)
create table voice_config (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('company', 'platform')),
  platform text, -- null for company, 'linkedin'/'twitter'/'longform'/'shortform' for platform
  rules text[] not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now()
);

-- Buckets
create table buckets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text not null default '#4A9EDE',
  owner_id uuid references profiles(id) not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sources
create table sources (
  id uuid primary key default gen_random_uuid(),
  bucket_id uuid references buckets(id) on delete set null, -- null = inbox
  owner_id uuid references profiles(id) not null,
  content text not null,
  source_type text not null check (source_type in ('note', 'link', 'voice_memo', 'podcast_note', 'article_clip', 'tweet')),
  source_url text, -- optional URL for link types
  embedding vector(1536), -- for semantic search via pgvector
  metadata jsonb default '{}', -- flexible field for future use
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  bucket_id uuid references buckets(id) on delete set null,
  owner_id uuid references profiles(id) not null,
  title text, -- auto-generated or user-set
  include_all_buckets boolean default true,
  platform text, -- optional: if conversation is targeting a specific platform
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversation Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  draft_content text, -- extracted draft content from assistant messages (if any)
  created_at timestamptz default now()
);

-- Drafts
create table drafts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete set null,
  bucket_id uuid references buckets(id) on delete set null,
  owner_id uuid references profiles(id) not null,
  title text not null,
  platform text not null check (platform in ('linkedin', 'twitter', 'longform', 'shortform')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'published')),
  content text not null, -- markdown
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Draft Versions (simple version history)
create table draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references drafts(id) on delete cascade not null,
  version int not null,
  content text not null,
  created_at timestamptz default now()
);

-- Row Level Security: both users can see everything (workspace-wide visibility)
-- but only owners can edit their own sources, conversations, drafts
-- Voice config and buckets are editable by both users
```

---

## Claude System Prompt Template

This is the system prompt constructed dynamically for each conversation:

```
You are a content strategist and writing partner for Compound, an AI consulting company. You help brainstorm, structure, and draft content based on source material and writing guidelines.

## Your Role
- Your primary job is SYNTHESIS, not generation. Help the user find unexpected connections, contrarian angles, and narrative threads across their fragmented source material. The user's own ideas and voice should always drive the content — you are refining and organizing their thinking, not replacing it.
- When brainstorming, actively cross-reference sources from different contexts. The best content often comes from connecting ideas the user hadn't consciously linked.
- Distinguish between the user's original thoughts (voice memos, notes) and external material (articles, tweets). Prioritize the user's voice and use external material as supporting evidence or counterpoints.
- When the user asks for a draft, synthesize their sources into platform-appropriate content
- Follow the voice profile rules strictly — these define the writing style
- Reference specific sources when building arguments (quote or paraphrase them)
- Be direct and collaborative — this is a working session, not a formal interaction

## Company Voice
{company_voice_rules}

## {user_name}'s Personal Voice
{personal_voice_rules}

{#if platform}
## Platform: {platform_name}
{platform_voice_rules}
{/if}

## Source Material
The following sources are available from the bucket "{bucket_name}":

{#each sources}
---
[{source_type}] ({created_at})
{content}
{#if source_url}URL: {source_url}{/if}
---
{/each}

{#if include_all_buckets}
Additional sources from other buckets are also available:
{#each other_bucket_sources}
[Bucket: {bucket_name}] [{source_type}]
{content}
{/each}
{/if}

## Draft Format
When you produce or update a draft, wrap it in the following delimiters so the application can extract it:

<draft platform="{platform}" version="{version}">
[Your draft content in markdown]
</draft>

Always include these delimiters when producing draft content. Continue the conversation naturally outside the delimiters.
```

---

## UI Structure

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Logo    [Dashboard] [Inbox (3)] [Buckets]    [⚙] [+]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Main content area (changes based on view)               │
│                                                          │
│  ┌─────────────────────────┬────────────────────────┐   │
│  │                         │                         │   │
│  │  Chat / Content Panel   │  Draft / Sources Panel  │   │
│  │  (left)                 │  (right, contextual)    │   │
│  │                         │                         │   │
│  └─────────────────────────┴────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Views

1. **Dashboard** — Stats overview, bucket cards, recent activity, inbox preview
2. **Inbox** — Unsorted sources with quick-sort actions to move into buckets
3. **Bucket List** — All buckets as cards
4. **Bucket Detail** — Sources + drafts for a specific bucket, with "Start Conversation" button
5. **Conversation** — Split pane: chat thread (left) + working draft & sources (right)
6. **Draft Detail** — View/edit a specific draft, copy to clipboard, change status
7. **Settings** — API key, voice profiles (personal + company + platform)

### Conversation View (Detail)

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to [Bucket Name]          [Sources ▼] [Platform ▼] │
├──────────────────────────┬─────────────────────────────────┤
│                          │  ┌─ Working Draft ───────────┐  │
│  Chat Thread             │  │                           │  │
│                          │  │  [rendered markdown]      │  │
│  ┌──────────────────┐   │  │                           │  │
│  │ Claude:           │   │  │                           │  │
│  │ Based on your     │   │  │                           │  │
│  │ sources about...  │   │  │                           │  │
│  └──────────────────┘   │  │                           │  │
│                          │  ├───────────────────────────┤  │
│  ┌──────────────────┐   │  │  v3 ✓  v2  v1            │  │
│  │ You:              │   │  ├───────────────────────────┤  │
│  │ Make the hook     │   │  │  [Copy] [Save as Draft]  │  │
│  │ more provocative  │   │  │  Status: draft ▼         │  │
│  └──────────────────┘   │  └───────────────────────────┘  │
│                          │                                 │
│  ┌──────────────────┐   │  ┌─ Sources ──────────────────┐ │
│  │ Claude:           │   │  │  [source cards from        │ │
│  │ Here's a revised  │   │  │   bucket, collapsible]     │ │
│  │ version...        │   │  │                            │ │
│  └──────────────────┘   │  └────────────────────────────┘ │
│                          │                                 │
│  ┌──────────────────────┐│                                 │
│  │ Message input...     ││                                 │
│  │              [Send]  ││                                 │
│  └──────────────────────┘│                                 │
└──────────────────────────┴─────────────────────────────────┘
```

---

## Tech Stack Details

### Frontend
- **Next.js 14** with App Router
- **Tailwind CSS** for styling (dark theme — keep the aesthetic from Srikar's prototype)
- **React state + Supabase Realtime** for live updates
- **react-markdown** for rendering draft content
- Streaming Claude responses via the Anthropic SDK's streaming API

### Backend
- **Next.js API Routes** (Route Handlers) for:
  - Proxying Anthropic API calls (so API keys don't hit the client)
  - CRUD operations on all entities
- **Supabase** for:
  - Auth (email/password)
  - Postgres database
  - Row Level Security for basic access control
  - Realtime subscriptions (for cross-user visibility)

### API Key Handling
- User enters their Anthropic API key in settings
- Key is encrypted before storage in Supabase (use AES-256 encryption with an app-level secret in env vars)
- When making API calls, the server-side route handler decrypts the key and uses it
- Keys never sent to the client after initial entry

### Environment Variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_SECRET= # for API key encryption
```

---

## Design Direction

Keep the dark, minimal aesthetic from Srikar's prototype:
- **Background:** near-black (`#0D0D0D`)
- **Surfaces:** dark gray (`#161616`)
- **Borders:** subtle (`#2A2A2A`)
- **Text:** warm off-white (`#E8E6E3`)
- **Accent:** gold/amber (`#E8B931`) — Cambrian brand color
- **Font:** Die Grotesk A (display/headings) + Die Grotesk B (body/UI) + IBM Plex Mono (code/monospace)
- **Spacing:** generous, not cramped
- **Animation:** minimal — subtle hover states, smooth transitions, streaming text

---

## Build Plan (Weekend Sprint)

### Day 1: Foundation
1. `create-next-app` with TypeScript, Tailwind, App Router
2. Set up Supabase project: create tables, enable auth, configure RLS
3. Auth flow: login page, session management, redirect logic
4. Settings page: API key input, voice profile editors
5. Basic layout shell: nav bar, sidebar, main content area
6. Source capture: capture modal, inbox view, CRUD for sources

### Day 2: Core Loop
7. Bucket management: create, list, detail views
8. Source management within buckets: move from inbox, reorder
9. Conversation engine:
   - Build the split-pane conversation UI
   - Implement the Claude API integration (streaming, system prompt construction)
   - Draft extraction from Claude responses (parse `<draft>` delimiters)
   - Draft panel with version tracking
10. Basic draft management: list, status, copy to clipboard

### Day 3: Polish & Ship
11. Dashboard view with stats and recent activity
12. Cross-user visibility (see each other's buckets, sources, drafts)
13. Keyboard shortcuts (Cmd+K for capture, Cmd+Enter to send message)
14. Mobile responsiveness (basic — at least usable on phone for capture)
15. Deploy to Vercel, test with real data
16. Seed with existing content from Srikar's prototype mock data

---

## Future Iterations (Post-V1)

- **Projects hierarchy:** Projects contain buckets for better organization
- **Chrome extension:** Capture tweets, article clips, bookmarks directly into inbox
- **URL auto-fetch:** Paste a URL, system fetches and extracts content
- **Voice recording:** In-app recording with Deepgram/AssemblyAI transcription
- **AI auto-sort:** Claude suggests which bucket an inbox item belongs in
- **Collaboration:** Comments on drafts, @mentions, activity feed
- **Publishing integrations:** Post directly to LinkedIn, Twitter/X from the app
- **Analytics:** Track which themes are generating the most content, identify gaps
- **Scheduling:** Queue drafts for specific publish dates/times
- **Search:** Full-text search across all sources and drafts
- **Tags:** Cross-cutting tags that span multiple buckets
- **Export:** Export bucket + sources + drafts as a document
