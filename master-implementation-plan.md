# Cambrian Content Engine V1 — Master Implementation Plan

**Orchestrator:** Claude (this document is the source of truth for all agents)
**Last updated:** 2026-02-06
**Status:** PLANNING

---

## Vision

The content engine's core value is **synthesis, not generation**. The system maintains ever-growing context about both users' thoughts, conversations, readings, and ideas. When a user sits down to write, the AI draws on this accumulated context to help them find connections, refine angles, and draft content that authentically represents their thinking — not generic AI output.

## Architecture Overview

```
Sources (raw material)
    ↓ [embedded via pgvector on creation]
Buckets (thematic clusters) + Shared Context Layer (semantic search across all sources)
    ↓
Two Explicit Modes (user selects, no auto-detection):
    Explore Mode: Opus — retrieval (pgvector search) + synthesis (brainstorm angles)
    Draft Mode:   Sonnet — writes from full Explore conversation context + voice profiles
    ↓
Drafts (platform-specific output: LinkedIn, Twitter/X, long-form, short-form)
```

**Stack:** Next.js 14 (App Router, TypeScript) + Supabase (Auth, Postgres, Realtime, pgvector) + Anthropic Claude API + OpenAI Embeddings + Tailwind CSS + Vercel

**Fonts:** Die Grotesk A (display/headings) + Die Grotesk B (body/UI) + IBM Plex Mono (code/monospace)

**Estimated monthly API costs:** ~$25-70/month (Opus ~$20-50, Sonnet ~$5-15, Haiku ~$1-3, Embeddings ~$0.10, Supabase free tier, Vercel free tier)

---

## Task Dependency Graph

```
Task 0  (Design System)        ──┐
Task 1  (Project Scaffolding)  ──┤
Task 2  (Supabase Setup)       ──┼──► Task 3 (Auth) ──► Task 1.5 (Rebrand) ──► Task 4 (Layout Shell)
                                 │                                                     │
                                 │                                              Task 4.5 (shadcn/ui)
                                 │                                                     │
                                 │                                              ┌──────┴──────┐
                                 │                                              │             │
                                 │                                        Task 5 (Settings)  Task 6 (Source Capture)
                                 │                                                            │
Task 2.5 (Embeddings) ◄── Task 2│                                          Task 7 (Buckets) ◄┘
                                 │                                                  │
                                 │    ┌─────────────────────────────────────────────┘
                                 │    │
                                 │    ▼
                                 │  Task 8: Two-Mode Chat Pipeline
                                 │    ├── 8a (Explore Mode) ◄─ Task 2.5, Task 5
                                 │    ├── 8b (Draft Mode)   ◄─ Task 5
                                 │    └── 8c (Chat Router)  ◄── 8a+8b ──────────┐
                                 │                                               │
                                 │    Task 9 (Conversation UI) ◄─────────────────┘
                                 │              │
                                 │    Task 10 (Draft Panel) ◄── Task 9
                                 │              │
                                 │    ┌─────────┼──────────┐
                                 │    ▼         ▼          ▼
                                 │  Task 11   Task 12    (parallel)
                                 │  (Drafts)  (Dashboard)
                                 │    │         │
                                 │    └────┬────┘
                                 │         ▼
                                 │    Task 13 (Realtime)
                                 │         │
                                 │    Task 14 (Polish)
                                 │         │
                                 └──► Task 15 (Deploy)
```

---

## Parallel Execution Opportunities

These tasks CAN run in parallel:
- **Task 0 + Task 2 + Task 2.5 planning** — Design system, Supabase setup guide, and embedding infrastructure design are independent
- **Task 5 + Task 6** — Settings page and Source capture can be built simultaneously (both depend on Task 4)
- **Task 8a + 8b** — Explore Mode and Draft Mode can be built in parallel, then integrated by 8c
- **Task 11 + Task 12** — Draft management page and Dashboard can be built simultaneously

---

## Phase 0: Foundation

### Task 0 — Design System Extraction
**Status:** NOT STARTED
**Dependencies:** None
**Agent type:** Research + Documentation

**Objective:** Study the Cambrian website (`cambrian website v1/`) and the PRD's design specs. Produce a comprehensive `design-system.md` that every subsequent agent references for UI work.

**Scope:**
- Extract all colors, typography, spacing, shadows, border radii from the Cambrian website
- Font decision is RESOLVED: Die Grotesk A (display/headings), Die Grotesk B (body/UI text), IBM Plex Mono (code/monospace)
- Define the complete Tailwind theme extension config
- Document component patterns: cards, buttons, inputs, modals, badges, nav items
- Document animation/transition patterns (hover states, page transitions)
- Include dark theme surface hierarchy (bg → surface → surface-hover → border)
- Output: `design-system.md` in the project folder

**Key design tokens from Cambrian website:**
- Background: `#141414` (website) — reconcile with PRD's `#0D0D0D`
- Text: `#ffffff` (website primary), `#8E8E8E` (muted)
- Fonts: Die Grotesk A (woff2 in `assets/fonts/`), Die Grotesk B (woff2 in `assets/fonts/`)
- Selection: inverted (white bg, dark text)
- Generous padding (48px header/footer)
- Smooth transitions (0.2s-0.5s ease, cubic-bezier for content reveals)

**Acceptance criteria:**
- [ ] Complete color palette with hex values and semantic names
- [ ] Typography scale (font families, sizes, weights, line heights)
- [ ] Spacing and layout conventions
- [ ] Component style patterns (at least: button, input, card, modal, badge, nav)
- [ ] Ready-to-paste `tailwind.config.ts` theme extension
- [ ] Font files identified and loading strategy documented

**Reference files:**
- `cambrian website v1/index.html` (full CSS + design)
- `cambrian website v1/assets/fonts/` (available fonts)
- `product-requirements-document.md` → Design Direction section
- `claude-code-agent-instructions.md` → Tailwind Theme section

---

### Task 1 — Project Scaffolding
**Status:** COMPLETE
**Dependencies:** Task 0 (needs design system for Tailwind config)
**Agent type:** Builder

**Objective:** Initialize the Next.js project with all dependencies, folder structure, Tailwind config, and shared utilities. This is the skeleton every other agent builds on.

**Scope:**
- Run `create-next-app` with TypeScript, Tailwind, App Router, pnpm
- Install all dependencies from the architecture doc (including `openai` for embeddings)
- Set up the folder structure per the CLAUDE.md spec
- Configure `tailwind.config.ts` with the design system tokens from Task 0
- Set up the `cn()` utility (`clsx` + `tailwind-merge`)
- Create `lib/types.ts` with all TypeScript types from the architecture doc (updated for two model fields, conversation mode, embedding)
- Create placeholder/stub files for the folder structure
- Set up `.env.local.example` with all required env vars (including OPENAI_API_KEY for embeddings)
- Set up local font loading for Die Grotesk A/B (copy from website assets)
- Initialize git repo with initial commit

**Files to create:**
```
package.json (via create-next-app + installs)
tailwind.config.ts
tsconfig.json
app/layout.tsx (root layout with font loading, providers shell)
app/page.tsx (placeholder)
app/globals.css (Tailwind directives + custom CSS vars)
lib/types.ts (all types — including updated Profile with explore_model/draft_model)
lib/utils.ts (cn utility)
.env.local.example
```

**Acceptance criteria:**
- [ ] `pnpm dev` runs without errors
- [ ] Tailwind is working with custom theme tokens
- [ ] All TypeScript types are defined (including two-mode architecture types)
- [ ] Folder structure matches the CLAUDE.md spec
- [ ] Die Grotesk fonts load correctly
- [ ] `cn()` utility works
- [ ] Git initialized with clean first commit

**Reference files:**
- `design-system.md` (from Task 0)
- `technical-architecture-and-database-schema.md` → Dependencies section, TypeScript Types section
- `claude-code-agent-instructions.md` → File & Folder Structure, Tailwind Theme

---

### Task 2 — Supabase Database Setup
**Status:** NOT STARTED
**Dependencies:** None (can run in parallel with Task 0 and Task 1)
**Agent type:** Documentation / Manual guide

**Objective:** Produce a step-by-step Supabase setup guide that Abhay can follow to configure the project. Includes the full SQL migration (with pgvector, embedding column, updated schema), auth config, and RLS policies.

**Scope:**
- Write a `supabase-setup-guide.md` with:
  - Step-by-step Supabase project creation instructions
  - The complete SQL migration script (UPDATED with: pgvector extension, embedding column on sources, mode column on conversations, explore_model/draft_model on profiles, match_sources() function)
  - Auth configuration (enable email/password, create the 2 user accounts)
  - RLS policy verification steps
  - How to get the URL, anon key, and service role key
  - How to generate the ENCRYPTION_SECRET
- Include troubleshooting for common issues

**Output:** `supabase-setup-guide.md` in the project folder

**Acceptance criteria:**
- [ ] Complete SQL migration script including pgvector, embeddings, and two-mode schema changes
- [ ] Clear step-by-step instructions a non-technical person could follow
- [ ] All env vars documented with where to find them
- [ ] ENCRYPTION_SECRET generation command included
- [ ] pgvector extension enabled
- [ ] match_sources() function created

**Reference files:**
- `technical-architecture-and-database-schema.md` → Database Schema section (full SQL, updated)
- `product-requirements-document.md` → Data Model section

---

### Task 2.5 — pgvector & Embedding Pipeline
**Status:** COMPLETE
**Dependencies:** Task 1 (project must exist), Task 2 (Supabase must be set up with pgvector)
**Agent type:** Builder

**Objective:** Build the embedding API route that generates and stores embeddings for sources. This is the infrastructure that powers Explore mode's semantic search.

**Scope:**
- `app/api/embed/route.ts` — Embedding endpoint:
  - Receives source ID (single or batch)
  - Fetches source content from Supabase
  - Calls OpenAI `text-embedding-3-small` API to generate 1536-dim embedding
  - Stores embedding vector in the source's `embedding` column
  - Returns success/failure
- `lib/embeddings.ts` — Embedding utility:
  - OpenAI client setup
  - `embedText(text: string): Promise<number[]>` function
  - `embedBatch(texts: string[]): Promise<number[][]>` for bulk operations
- Integration with source creation flow:
  - After a source is created via `/api/sources`, automatically trigger embedding
  - Can be async (fire-and-forget) — source is usable immediately, embedding happens in background
- Backfill script for existing sources without embeddings

**Files to create:**
```
app/api/embed/route.ts
lib/embeddings.ts
scripts/backfill-embeddings.ts (optional CLI script)
```

**Acceptance criteria:**
- [ ] POST /api/embed accepts source ID(s) and generates embeddings
- [ ] Embeddings are stored in the sources table `embedding` column
- [ ] OpenAI text-embedding-3-small is used (1536 dimensions)
- [ ] Source creation flow triggers embedding automatically
- [ ] Error handling: missing OpenAI key, API failures, source not found
- [ ] `match_sources()` Supabase function works with stored embeddings

**Reference files:**
- `technical-architecture-and-database-schema.md` → Semantic Search section, POST /api/embed
- `claude-code-agent-instructions.md` → Critical Decision #9

---

## Phase 1: Auth & Layout

### Task 3 — Authentication Flow
**Status:** COMPLETE
**Dependencies:** Task 1 (project must exist), Task 2 (Supabase must be set up)
**Agent type:** Builder

**Objective:** Implement email/password login, session management, auth middleware, and route protection.

**Scope:**
- `lib/supabase/client.ts` — Browser Supabase client
- `lib/supabase/server.ts` — Server Supabase client + service role client
- `middleware.ts` — Auth middleware (redirect unauthenticated users to /login)
- `app/login/page.tsx` — Login page (email + password form, dark theme styled)
- Session refresh handling
- Redirect logic: unauthenticated → /login, authenticated on /login → /

**Out of scope:** Settings page, voice profiles, API key management (that's Task 5)

**Files to create/modify:**
```
lib/supabase/client.ts
lib/supabase/server.ts
middleware.ts
app/login/page.tsx
```

**Acceptance criteria:**
- [ ] Login page renders with email/password form
- [ ] Successful login redirects to dashboard
- [ ] Invalid credentials show error message
- [ ] Unauthenticated users are redirected to /login
- [ ] Session persists across page refreshes
- [ ] Logout works

**Reference files:**
- `technical-architecture-and-database-schema.md` → Supabase Client Setup section
- `claude-code-agent-instructions.md` → Critical Decisions #3, #4, #7
- `design-system.md` (from Task 0)

---

### Task 4 — Layout Shell & Navigation
**Status:** NOT STARTED
**Dependencies:** Task 3 (auth must work for user-aware nav)
**Agent type:** Builder

**Objective:** Build the root layout with navigation bar, user display, and the main content area shell.

**Scope:**
- `app/layout.tsx` — Root layout with nav bar, auth provider
- Navigation component with links: Dashboard, Inbox (with count badge), Buckets, Settings
- Global `+ Capture` button in nav (just the button — capture modal is Task 6)
- User avatar/initial display with logout
- Mobile-responsive nav
- Dark theme body styles

**Files to create/modify:**
```
app/layout.tsx
components/layout/nav-bar.tsx
components/layout/user-menu.tsx
components/ui/button.tsx (base button component)
```

**Acceptance criteria:**
- [ ] Nav bar renders on all authenticated pages
- [ ] Active nav item is visually indicated
- [ ] User's display name or initial shown
- [ ] Logout button works
- [ ] `+ Capture` button is visible (non-functional placeholder OK)
- [ ] Responsive on mobile
- [ ] Dark theme applied globally

**Reference files:**
- `product-requirements-document.md` → UI Structure section (layout diagram)
- `design-system.md` (from Task 0)
- `claude-code-agent-instructions.md` → Component Patterns

---

### Task 4.5 — shadcn/ui Setup & Design Token Integration
**Status:** NOT STARTED
**Dependencies:** Task 4 (layout shell must exist to migrate its tokens)
**Agent type:** Builder

**Objective:** Install and configure shadcn/ui with Tailwind v4 native support. Migrate Specter design tokens from `@theme` to shadcn's `:root` + `@theme inline` pattern. This gives Tasks 5–14 access to accessible UI primitives (Dialog, Select, Dropdown, Tabs, etc.).

**Scope:**
- Install `tw-animate-css`, `lucide-react`, `class-variance-authority`
- Create `components.json` for shadcn CLI
- Rewrite `app/globals.css` to shadcn variable pattern (`:root` + `@theme inline`)
- Migrate all existing components from old token names to shadcn naming (Ghost Cyan = `--primary`, not `--accent`)
- Add Button component via `npx shadcn@latest add button` as validation
- Keep Specter extended tokens (success, warning, accent-hover, etc.) alongside shadcn standard ones

**Key decision:** `--primary` = Ghost Cyan (#068BD4), `--accent` = neutral hover gray (#2D3748). All existing `bg-accent`/`text-accent` references change to `bg-primary`/`text-primary`.

**Acceptance criteria:**
- [ ] shadcn/ui initialized with Tailwind v4 native support
- [ ] All components migrated to shadcn token names
- [ ] Button component renders all 6 variants correctly
- [ ] No TypeScript errors, no console errors
- [ ] Specter design preserved (Ghost Cyan primary, True Black background)

**Reference files:**
- `task-briefs/task-4.5-shadcn-ui-setup.md` (detailed step-by-step brief)
- `design-system.md` (Specter design tokens)

---

## Phase 2: Data Layer & CRUD

### Task 5 — Settings Page (API Key + Voice Profiles + Model Selection)
**Status:** NOT STARTED
**Dependencies:** Task 4.5 (needs shadcn components: Form, Switch, Select, Tabs)
**Agent type:** Builder

**Objective:** Build the settings page where users configure their Anthropic API key, edit voice profiles, and select models for the two-mode architecture.

**Scope:**
- `app/settings/page.tsx` — Settings page with sections for:
  - API key input (masked display, save/update/delete)
  - **Model selection: two dropdowns — "Explore model" (default Opus) and "Draft model" (default Sonnet)**
  - Personal voice profile editor (list of rules, add/remove/edit)
  - Company voice profile editor (shared, same UI)
  - Platform voice profiles (LinkedIn, Twitter/X, Long-form, Short-form)
- `app/api/settings/route.ts` — API routes for:
  - POST/GET API key (encrypt before storage, never return actual key)
  - PATCH personal voice profile
  - PATCH shared voice config
  - PATCH model selection (explore_model, draft_model)
- `lib/encryption.ts` — AES-256-GCM encrypt/decrypt functions

**Files to create/modify:**
```
app/settings/page.tsx
app/api/settings/api-key/route.ts
app/api/settings/voice-profile/route.ts
app/api/settings/voice-config/[id]/route.ts
lib/encryption.ts
```

**Acceptance criteria:**
- [ ] User can enter and save their Anthropic API key
- [ ] API key is encrypted before storage (AES-256-GCM)
- [ ] Settings page shows whether a key is set (not the key itself)
- [ ] User can select explore model (default: Opus) and draft model (default: Sonnet)
- [ ] User can edit their personal voice profile (add/remove rules)
- [ ] User can edit the shared company voice profile
- [ ] User can edit platform-specific voice profiles
- [ ] All changes persist to Supabase

**Reference files:**
- `technical-architecture-and-database-schema.md` → API Key Encryption section, API Route Specifications
- `product-requirements-document.md` → Voice Profiles section, Authentication & User Setup
- `claude-code-agent-instructions.md` → Claude API Integration, Critical Decision #8

---

### Task 6 — Source Capture & Inbox
**Status:** NOT STARTED
**Dependencies:** Task 4 (needs layout shell + nav with capture button), Task 2.5 (sources trigger embedding on creation)
**Agent type:** Builder

**Objective:** Build the source capture modal and inbox view. Sources are automatically embedded on creation.

**Scope:**
- Capture modal (global, triggered by `+ Capture` button or Cmd+K):
  - Text/note input (free text area)
  - URL/link input (URL field + annotation text)
  - Source type dropdown (note, link, voice_memo, podcast_note, article_clip, tweet)
  - Destination picker (inbox or specific bucket)
  - Bulk paste mode (split by paragraph/line break into individual sources)
- `app/inbox/page.tsx` — Inbox view:
  - List of unsorted sources (bucket_id is null)
  - Source cards showing content preview, type badge, timestamp
  - Quick actions: move to bucket, edit, delete
- API routes for source CRUD
- **After source creation, fire-and-forget call to /api/embed to generate embedding**

**Files to create/modify:**
```
components/sources/capture-modal.tsx
components/sources/source-card.tsx
app/inbox/page.tsx
app/api/sources/route.ts
app/api/sources/[id]/route.ts
```

**Acceptance criteria:**
- [ ] Capture modal opens from nav button and Cmd+K
- [ ] User can create a note-type source
- [ ] User can create a link-type source with URL + annotation
- [ ] User can select source type from dropdown
- [ ] User can choose destination (inbox or bucket)
- [ ] Bulk paste splits multi-line text into individual sources
- [ ] Inbox page lists all unsorted sources
- [ ] Sources can be edited and deleted
- [ ] Sources can be moved to a bucket
- [ ] **New sources trigger embedding generation automatically**

**Reference files:**
- `product-requirements-document.md` → Source Capture section
- `technical-architecture-and-database-schema.md` → POST/GET/PATCH/DELETE /api/sources
- `claude-code-agent-instructions.md` → Critical Decision #9
- `design-system.md`

---

### Task 7 — Bucket Management
**Status:** NOT STARTED
**Dependencies:** Task 6 (sources must exist to populate buckets)
**Agent type:** Builder

**Objective:** Build bucket CRUD, bucket list view, and bucket detail view.

**Scope:**
- `app/buckets/page.tsx` — Bucket list view:
  - Bucket cards showing name, color, description, source count, draft count
  - Create new bucket (inline or modal)
- `app/buckets/[id]/page.tsx` — Bucket detail view:
  - All sources in the bucket (reuse source-card component)
  - All drafts in the bucket (preview cards)
  - "Start Conversation" button (creates conversation, navigates to Task 9's UI)
  - Bucket settings (rename, change color, delete)
- Move sources between buckets
- API routes for bucket CRUD
- Color palette auto-assignment

**Files to create/modify:**
```
app/buckets/page.tsx
app/buckets/[id]/page.tsx
components/buckets/bucket-card.tsx
components/buckets/create-bucket-modal.tsx
app/api/buckets/route.ts
app/api/buckets/[id]/route.ts
```

**Acceptance criteria:**
- [ ] User can create a bucket with name, description, color
- [ ] Bucket list shows all buckets with source/draft counts
- [ ] Bucket detail shows all sources in that bucket
- [ ] User can rename, recolor, and delete buckets
- [ ] Sources can be moved between buckets
- [ ] Color auto-assigned from palette on creation
- [ ] "Start Conversation" button present and functional (creates conversation record, navigates to /conversations/[id])

**Reference files:**
- `product-requirements-document.md` → Bucket Management section
- `technical-architecture-and-database-schema.md` → Bucket API routes
- `design-system.md`

---

## Phase 3: Core Feature — Two-Mode Chat Pipeline

### Task 8 — Two-Mode Chat Pipeline
**Status:** NOT STARTED
**Dependencies:** Task 5 (API keys + voice profiles), Task 2.5 (embedding infrastructure), Task 7 (buckets for context)
**Agent type:** Builder (can be split into parallel sub-agents)

**Objective:** Build the server-side chat pipeline with two explicit modes: Explore (Opus + retrieval) and Draft (Sonnet + conversation context). The user selects the mode — no auto-detection.

**This task is decomposable into 3 sub-tasks (8a-8c) that can be built by separate agents in parallel, then integrated.**

#### Task 8a — Explore Mode (Retrieval + Synthesis)
**Dependencies:** Task 2.5 (embedding infrastructure + match_sources), Task 5 (voice profiles)

**Scope:**
- `lib/claude/prompts.ts` → `buildExplorePrompt()` function
- Retrieval layer (runs automatically when user sends a message in Explore mode):
  - Embeds user's message via `lib/embeddings.ts`
  - Queries `match_sources()` for top-k semantically relevant sources across all buckets
  - Also includes all current-bucket sources regardless of similarity
  - Injects retrieved sources into Opus's context
- Synthesis layer (Opus conversation):
  - System prompt helps user find angles, connect ideas, brainstorm narratives
  - Distinguishes user's original thoughts from external material
  - Calls Opus with streaming
  - Does NOT produce structured briefs or `<brief>` tags — just natural conversation

**Acceptance criteria:**
- [ ] Embeds user message and queries match_sources() automatically
- [ ] Returns relevant sources with similarity scores and bucket attribution
- [ ] Includes all current-bucket sources
- [ ] Explore prompt is well-crafted: finds angles, references sources, does NOT draft
- [ ] Calls Opus with streaming
- [ ] Distinguishes user's original thoughts from external material in prompt

---

#### Task 8b — Draft Mode
**Dependencies:** Task 5 (needs voice profiles + platform rules)

**Scope:**
- `lib/claude/prompts.ts` → `buildDraftPrompt()` function
- Takes full Explore conversation history as context (NOT a structured brief)
- Also takes voice profiles (personal + company + platform) and platform rules
- System prompt: "You are in DRAFT mode. Write compelling content based on the conversation context. Follow voice and platform rules exactly."
- Calls Sonnet with streaming
- `lib/claude/parse.ts` → `extractDraft()` — parses `<draft>` tags
- Saves/updates drafts table + draft_versions
- Supports repurposing: same Explore conversation, switch platform → hit Draft again → new draft

**Acceptance criteria:**
- [ ] Draft prompt takes full conversation context + voice profiles + platform rules
- [ ] Calls Sonnet with streaming
- [ ] Parses `<draft>` tags and saves to drafts table
- [ ] Creates draft versions on each new draft
- [ ] Repurposing works: same conversation, different platform → new draft

---

#### Task 8c — Chat Router
**Dependencies:** Task 8a + 8b (integrates both modes)

**Scope:**
- `app/api/chat/route.ts` — The main chat endpoint:
  1. Verify auth session
  2. Fetch + decrypt user's Anthropic API key
  3. Read `mode` from request body (`explore` or `draft` — user selects explicitly)
  4. Fetch conversation history
  5. Route to Explore mode (8a) or Draft mode (8b) based on `mode` parameter
  6. Stream response back as SSE
  7. Save user message + assistant message to DB
- `app/api/conversations/route.ts` — Conversation CRUD
- `app/api/conversations/[id]/route.ts` — Get/update conversation

**Acceptance criteria:**
- [ ] POST /api/chat routes to correct mode based on request `mode` parameter
- [ ] SSE streaming works for both modes
- [ ] Messages persisted to DB after stream
- [ ] No auto-detection — mode comes from request body
- [ ] Error handling: missing API key, invalid key, rate limits, missing mode
- [ ] Repurposing: user can switch platform and re-trigger Draft mode

---

### Task 9 — Conversation UI (Split Pane + Mode Switching)
**Status:** NOT STARTED
**Dependencies:** Task 8c (needs chat API router), Task 7 (needs buckets for context)
**Agent type:** Builder

**Objective:** Build the conversation view — the primary interface for content creation. Split-pane layout with chat on the left and sources/draft on the right. Mode-aware UI with explicit Explore/Draft toggle.

**Scope:**
- `app/conversations/[id]/page.tsx` — Conversation page:
  - Create new conversation (from bucket detail "Start Conversation" button)
  - Load existing conversation with message history
- Left pane — Chat thread:
  - Message bubbles (user + assistant, visually distinct)
  - Message input with send button (Cmd+Enter to send)
  - Streaming response display
  - Scroll to bottom on new messages
- Right pane — **Two states based on mode:**
  - **Explore mode:** Show retrieved sources with relevance scores and bucket attribution
  - **Draft mode:** Show the working draft (rendered markdown) with editable textarea for refinement
- Header controls:
  - Back to bucket link
  - **Mode toggle: Explore / Draft** (user explicitly switches, like Cursor modes)
  - Platform selector dropdown
  - "Bucket only" toggle (default is cross-bucket semantic search)
- **"Repurpose" flow:** In Draft mode, select a different platform and trigger Draft again (same Explore conversation → new draft)
- Client-side streaming consumption (SSE parsing, draft extraction during stream)

**Files to create/modify:**
```
app/conversations/[id]/page.tsx
components/chat/chat-thread.tsx
components/chat/message-bubble.tsx
components/chat/message-input.tsx
components/chat/use-chat-stream.ts (hook)
components/layout/split-pane.tsx
components/chat/mode-toggle.tsx
components/chat/sources-panel.tsx
```

**Acceptance criteria:**
- [ ] User can start a new conversation from a bucket
- [ ] Chat thread displays message history
- [ ] User can type and send messages
- [ ] Claude's response streams in real-time
- [ ] Right pane shows sources in Explore mode, draft in Draft mode
- [ ] Mode toggle shows current mode (Explore / Draft)
- [ ] User can explicitly switch between Explore and Draft modes
- [ ] Platform selector works
- [ ] "Bucket only" toggle works
- [ ] Repurposing: switch platform, hit Draft again → new draft
- [ ] Conversation persists — user can leave and return

**Reference files:**
- `product-requirements-document.md` → Conversational AI section, Conversation View wireframe
- `technical-architecture-and-database-schema.md` → Client-Side Streaming Pattern
- `claude-code-agent-instructions.md` → Critical Decisions #8, #10
- `design-system.md`

---

### Task 10 — Draft Panel (Versions, Copy, Status)
**Status:** NOT STARTED
**Dependencies:** Task 9 (needs conversation UI with draft display)
**Agent type:** Builder

**Objective:** Build the full draft panel within the conversation view — version tracking, copy to clipboard, save as draft, status management.

**Scope:**
- Draft panel enhancements (within conversation right pane, drafting mode):
  - Version list (v1, v2, v3...) — click to view previous versions
  - "Copy to clipboard" button
  - "Save as Draft" button (creates/updates a draft record)
  - Status badge + dropdown (draft → ready → published)
  - Draft title (editable)
  - Platform badge
- Draft version creation: each time Claude produces a new draft in conversation, auto-save as a new version
- API routes for draft CRUD

**Files to create/modify:**
```
components/drafts/draft-panel.tsx
components/drafts/version-list.tsx
components/drafts/status-badge.tsx
app/api/drafts/route.ts
app/api/drafts/[id]/route.ts
```

**Acceptance criteria:**
- [ ] Draft panel shows rendered markdown
- [ ] Each new draft from Claude creates a new version
- [ ] User can browse previous versions
- [ ] Copy to clipboard works
- [ ] Draft can be saved with a title
- [ ] Status can be changed (draft → ready → published)
- [ ] Versions are persisted in draft_versions table

**Reference files:**
- `product-requirements-document.md` → Draft Management section
- `technical-architecture-and-database-schema.md` → Draft API routes

---

## Phase 4: Views & Polish

### Task 11 — Draft Management Page
**Status:** NOT STARTED
**Dependencies:** Task 10 (drafts must exist)
**Agent type:** Builder

**Objective:** Build the standalone draft list and detail views for managing drafts outside of conversations.

**Scope:**
- `app/drafts/page.tsx` — Draft list:
  - Filter by platform, status, bucket
  - Draft cards showing title, platform badge, status badge, snippet, date
- `app/drafts/[id]/page.tsx` — Draft detail:
  - Rendered markdown content
  - Inline markdown editor (toggle between view/edit)
  - Copy to clipboard
  - Status transitions
  - Link back to originating conversation
  - Version history

**Files to create/modify:**
```
app/drafts/page.tsx
app/drafts/[id]/page.tsx
components/drafts/draft-card.tsx
components/drafts/draft-editor.tsx
components/drafts/draft-filters.tsx
```

**Acceptance criteria:**
- [ ] Draft list page shows all drafts
- [ ] Filters work (platform, status, bucket)
- [ ] Draft detail shows rendered markdown
- [ ] User can edit draft content directly (markdown editor)
- [ ] Copy to clipboard works
- [ ] Status transitions work
- [ ] Version history is viewable

**Reference files:**
- `product-requirements-document.md` → Draft Management section
- `design-system.md`

---

### Task 12 — Dashboard
**Status:** NOT STARTED
**Dependencies:** Task 7 (buckets), Task 6 (sources), Task 10 (drafts)
**Agent type:** Builder

**Objective:** Build the dashboard home page with overview stats, quick links, and recent activity.

**Scope:**
- `app/page.tsx` — Dashboard:
  - Stats cards: total sources, active drafts by status, inbox count
  - Bucket cards with source/draft counts (quick links)
  - Inbox preview (latest unsorted sources)
  - Recent conversations list
  - Recent activity feed (across both users)

**Files to create/modify:**
```
app/page.tsx
components/dashboard/stats-cards.tsx
components/dashboard/recent-activity.tsx
components/dashboard/inbox-preview.tsx
```

**Acceptance criteria:**
- [ ] Dashboard shows accurate counts (sources, drafts, inbox)
- [ ] Bucket cards link to bucket detail
- [ ] Inbox preview shows latest unsorted sources
- [ ] Recent conversations are listed with links

**Reference files:**
- `product-requirements-document.md` → Dashboard section
- `design-system.md`

---

### Task 13 — Realtime & Cross-User Visibility
**Status:** NOT STARTED
**Dependencies:** Task 12 (all views must exist to add realtime to)
**Agent type:** Builder

**Objective:** Add Supabase Realtime subscriptions so both users see live updates.

**Scope:**
- Supabase Realtime subscriptions on key tables: sources, buckets, drafts, conversations
- Verify RLS policies allow cross-user reads
- Subtle presence indicators

**Files to create/modify:**
```
lib/supabase/realtime.ts (or hooks)
Update existing page components to subscribe to realtime events
```

**Acceptance criteria:**
- [ ] When User A creates a source, User B sees it appear without refresh
- [ ] When User A creates/updates a draft, User B sees the change
- [ ] Both users can see all buckets, sources, and drafts
- [ ] No stale data on shared views

**Reference files:**
- `product-requirements-document.md` → Visibility rules
- `claude-code-agent-instructions.md` → Critical Decision #7

---

### Task 14 — Keyboard Shortcuts & UX Polish
**Status:** NOT STARTED
**Dependencies:** Task 13 (all features must be built)
**Agent type:** Builder

**Objective:** Add keyboard shortcuts, loading states, error handling, toasts, and mobile responsiveness.

**Scope:**
- Keyboard shortcuts: Cmd+K (capture), Cmd+Enter (send), Escape (close modals)
- Loading states: skeleton components or spinners
- Error handling: toast notifications
- Mobile responsiveness
- Smooth transitions and hover states
- Empty states with helpful prompts

**Files to create/modify:**
```
components/ui/toast.tsx
components/ui/skeleton.tsx
lib/hooks/use-keyboard-shortcuts.ts
Update all page components for loading/error/empty states
```

**Acceptance criteria:**
- [ ] Cmd+K opens capture modal from anywhere
- [ ] Cmd+Enter sends message in conversation
- [ ] All async operations show loading states
- [ ] Errors show user-friendly toast messages
- [ ] Empty states have helpful prompts
- [ ] Usable on mobile

**Reference files:**
- `product-requirements-document.md` → Build Plan Day 3
- `design-system.md`

---

## Phase 5: Ship

### Task 15 — Deployment to Vercel
**Status:** NOT STARTED
**Dependencies:** Task 14
**Agent type:** Documentation + Builder

**Objective:** Deploy to Vercel, configure environment variables, verify everything works in production.

**Scope:**
- Vercel project setup
- Environment variable configuration (Supabase URL, anon key, service role key, ENCRYPTION_SECRET, OPENAI_API_KEY)
- Build verification
- Production smoke test: full workflow end-to-end
- Domain setup (if applicable)

**Acceptance criteria:**
- [ ] App is live on Vercel
- [ ] All env vars configured
- [ ] Both users can log in
- [ ] Full workflow works: capture → bucket → conversation (Explore → Draft) → draft
- [ ] Repurposing works in production
- [ ] No console errors in production

---

## Progress Tracker

| Task | Name | Status | Agent | Notes |
|------|------|--------|-------|-------|
| 0 | Design System Extraction | COMPLETE | Sonnet | Specter rebrand — design-system.md rewritten |
| 1 | Project Scaffolding | COMPLETE | Sonnet 4.5 | 57 files, 11,018 lines (cba3ab6) |
| 1.5 | Specter Rebrand Implementation | COMPLETE | Sonnet 4.5 | Combined with 4.5 — fonts, logo, colors, branding (8d0ccdc) |
| 2 | Supabase Database Setup | COMPLETE | Abhay | Supabase project live (fbjtjhyvuhcebyomvmsa, us-east-1) |
| 2.5 | pgvector & Embedding Pipeline | COMPLETE | Sonnet 4.5 | 5 files, 733 lines, semantic search tested (22c38b6) |
| 3 | Authentication Flow | COMPLETE | Sonnet 4.5 | 8 files, 366 lines, Tailwind v4 migration (29905de) |
| 4 | Layout Shell & Navigation | COMPLETE | Sonnet 4.5 | 11 files, 410 lines, sidebar + topbar + mobile (3513296) |
| 4.5 | shadcn/ui Setup & Design Token Integration | COMPLETE | Sonnet 4.5 | Combined with 1.5 — shadcn tokens, Button component (8d0ccdc) |
| 5 | Settings (API Key + Voice + Models) | COMPLETE | Sonnet | 12 files, 942 lines (7d12f39) |
| 6 | Source Capture & Inbox | COMPLETE | Sonnet | 18 files, 1,527 lines — Cmd+K, CRUD, auto-embed |
| 7 | Bucket Management | COMPLETE | Sonnet | CRUD, list, detail, conversation creation |
| — | Review Fixes (Pre-Task 8) | COMPLETE | Sonnet | 5 HIGH fixes + .env.example (6e166bd) |
| 8a | Explore Mode (Retrieval + Synthesis) | COMPLETE | Sonnet | Opus streaming, pgvector retrieval, three-way dedup (9ce815e) |
| 8b | Draft Mode | COMPLETE | Sonnet | Sonnet streaming, voice profiles, `<draft>` parsing (d2df6b0) |
| 8c | Chat Router | COMPLETE | Sonnet | Auth, SSE streaming, voice resolution, message persistence (6f73896) |
| 9 | Conversation UI | COMPLETE | Sonnet | 13 files, 1,679 lines — split-pane chat, streaming, mode toggle (e1b5e04) |
| 10 | Draft Panel | COMPLETE | Sonnet | 5 routes, 4 components, versioning, save/update flow (5cb7174) |
| 11 | Draft Management Page | NOT STARTED | — | Depends on 10 |
| 12 | Dashboard | NOT STARTED | — | Depends on 7, 6, 10 |
| 13 | Realtime & Cross-User | NOT STARTED | — | Depends on 12 |
| 14 | Polish & Shortcuts | NOT STARTED | — | Depends on 13 |
| 15 | Deploy to Vercel | NOT STARTED | — | Depends on 14 |

---

## Decisions Log

| Decision | Resolution | Date |
|----------|-----------|------|
| Font choice | Die Grotesk A (display), Die Grotesk B (body), IBM Plex Mono (monospace) | 2026-02-06 |
| Embedding provider | OpenAI text-embedding-3-small (1536 dims, ~$0.02/1M tokens) | 2026-02-06 |
| AI architecture | Two explicit modes: Explore (Opus + retrieval) and Draft (Sonnet + conversation context) | 2026-02-06 |
| Cross-bucket default | Semantic search across all buckets is default; "Bucket only" is the override | 2026-02-06 |
| Mode selection | User explicitly selects Explore or Draft — no auto-detection, no keyword heuristics | 2026-02-06 |
| Brief handoff | No structured `<brief>` tags — full conversation context passed to Draft mode | 2026-02-06 |
| ivfflat index | Commented out for V1 (exact search fast enough at small scale) | 2026-02-06 |
| Tailwind config | Tailwind v4 CSS-based (@theme directive in globals.css), NOT JS config. Use CSS custom properties (var(--color-bg)) in stylesheets. | 2026-02-06 |
| Brand rebrand | Specter (from Cambrian). Ghost Cyan #068BD4, True Black #030712, Clash Display + Manrope + JetBrains Mono | 2026-02-06 |
| shadcn/ui | YES — add shadcn/ui with Tailwind v4 native support. Token naming migrates to shadcn convention (--primary = brand color, --accent = neutral hover). Task 4.5 created. | 2026-02-06 |

---

## Abhay Action Items

1. ~~Set up Supabase project~~ — DONE (2026-02-06)
2. ~~Get OpenAI API key~~ — DONE (2026-02-06). Task 2.5 complete with OpenAI text-embedding-3-small.
3. ~~Get Anthropic API key~~ — DONE (confirmed 2026-02-07)
