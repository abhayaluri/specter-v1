# CLAUDE.md — Specter Content Engine V1

## Project Overview

This is the Specter Content Engine, a content creation tool for a two-person team (Abhay and Srikar) at Compound. It captures ideas from multiple sources, organizes them into thematic buckets, and uses conversational AI (Claude) to brainstorm, synthesize, and draft content for LinkedIn, Twitter/X, long-form, and short-form publishing.

**This is a weekend build. Ship fast, iterate later. Favor working software over perfect architecture.**

## Key Documents

- `product-requirements-document.md` — What we're building and why
- `technical-architecture-and-database-schema.md` — How it's built: database schema, API specs, code patterns
- `builder-agent-guide.md` — How to interpret task briefs, what you own, when to deviate or escalate

Read your task brief + the builder guide + this file before starting.

## Stack

- **Framework:** Next.js 16.1.6, App Router, TypeScript
- **Styling:** Tailwind CSS v4 (dark theme, CSS-based config via `@theme` directive — NOT `tailwind.config.ts`)
- **UI Components:** shadcn/ui (Tailwind v4 native, `:root` + `@theme inline` pattern)
- **Database & Auth:** Supabase (Postgres + Auth + pgvector + Realtime)
- **AI:** Anthropic Claude API (Messages endpoint, streaming) — Opus (Explore mode), Sonnet (Draft mode)
- **Embeddings:** OpenAI text-embedding-3-small (1536 dims)
- **Deployment:** Vercel
- **Package manager:** pnpm

## Critical Decisions (Do Not Deviate)

1. **App Router only.** No Pages Router. All routes under `app/`.
2. **Server Components by default.** Only use `"use client"` when the component needs interactivity (state, effects, event handlers, browser APIs).
3. **API routes handle all sensitive operations.** Claude API calls, API key decryption, and any Supabase service-role operations go through `app/api/` route handlers. Never expose API keys or service-role tokens to the client.
4. **Supabase client-side SDK for reads.** Use the anon key + RLS for client-side data fetching. Use the service role key server-side only.
5. **Streaming for Claude responses.** Always use streaming when calling the Anthropic API. Never wait for the full response before displaying.
6. **Dark theme only for V1.** No light mode toggle. Keep it simple.
7. **Two users only.** Don't over-engineer auth or permissions. Email/password login, both users see everything, owners can edit their own stuff.
8. **Two explicit modes (Explore + Draft).** The user explicitly selects a mode — no auto-detection. **Explore mode** (Opus) does retrieval (pgvector semantic search) + synthesis (brainstorming angles, connecting ideas). **Draft mode** (Sonnet) writes platform-specific content using the full Explore conversation as context. Edit is just an editable textarea on the draft, not a separate AI mode.
9. **Sources are embedded on creation.** Every source gets an embedding vector stored via pgvector. Explore mode uses semantic search to find relevant sources across all buckets, not just the current bucket.
10. **Full conversation context for Draft mode.** The full Explore conversation history is passed as context to Sonnet in Draft mode. Repurposing works by keeping the same Explore conversation and switching the target platform.
11. **Async params (Next.js 16).** Dynamic route segments use `{ params }: { params: Promise<{ id: string }> }` with `const { id } = await params`. Do NOT use synchronous params.
12. **Tailwind v4 CSS-based config.** Design tokens live in `app/globals.css` using `:root` + `@theme inline`. Do NOT create or use `tailwind.config.ts`.

## Conventions

### File & Folder Structure

```
app/
  layout.tsx              # Root layout (providers, AppShell)
  page.tsx                # Dashboard (home)
  login/page.tsx          # Auth
  inbox/page.tsx          # Inbox view
  buckets/
    page.tsx              # Bucket list
    [id]/page.tsx         # Bucket detail
  conversations/
    page.tsx              # Conversations list
    [id]/page.tsx         # Conversation view (split pane)
  drafts/
    page.tsx              # Draft list
    [id]/page.tsx         # Draft detail
  settings/page.tsx       # API key, voice profiles, models
  api/
    chat/route.ts         # Claude streaming (routes to Explore or Draft engine)
    sources/route.ts      # Source CRUD
    sources/[id]/route.ts # Source detail
    buckets/route.ts      # Bucket CRUD
    buckets/[id]/route.ts # Bucket detail
    conversations/route.ts      # Conversation list + create
    conversations/[id]/route.ts # Conversation detail + update
    drafts/route.ts       # Draft CRUD
    settings/api-key/route.ts       # API key encrypt/store
    settings/voice-profile/route.ts # Personal voice rules
    settings/voice-config/[id]/route.ts # Company + platform voice
    settings/models/route.ts        # Model selection
    embed/route.ts        # Embedding endpoint
    auth/logout/route.ts  # Logout
components/
  ui/                     # shadcn/ui primitives (Button, Input, Dialog, etc.)
  chat/                   # Chat thread, message bubbles, input
  drafts/                 # Draft panel, version list, status badge
  sources/                # Source cards, capture modal
  buckets/                # Bucket cards, bucket detail
  layout/                 # AppShell, sidebar, topbar
lib/
  supabase/
    client.ts             # Browser Supabase client (anon key)
    server.ts             # Server Supabase client
    middleware.ts          # Auth middleware
  claude/
    client.ts             # createAnthropicClient(apiKey) helper
    explore.ts            # Explore mode engine (retrieval + Opus streaming)
    draft.ts              # Draft mode engine (voice + Sonnet streaming)
    prompts.ts            # Explore system prompt builder + shared types
    parse.ts              # Draft extraction (<draft> tag parsing)
    title.ts              # Auto-title generation (Haiku, fire-and-forget)
  embeddings.ts           # OpenAI embedding functions (embedText, embedBatch)
  encryption.ts           # API key encrypt/decrypt (AES-256-GCM)
  types.ts                # Shared TypeScript types
  utils.ts                # Helpers (cn, etc.)
```

### Naming

- **Files:** kebab-case (`capture-modal.tsx`, `bucket-card.tsx`)
- **Components:** PascalCase (`CaptureModal`, `BucketCard`)
- **Database tables:** snake_case (`draft_versions`, `voice_config`)
- **API routes:** REST-ish (`POST /api/sources`, `GET /api/buckets/[id]`)
- **Types:** PascalCase, suffix with purpose (`Source`, `Bucket`, `CreateSourceInput`)

### Component Patterns

- Keep components focused. If a component file exceeds ~150 lines, break it up.
- Co-locate component-specific types in the same file.
- Use `cn()` utility (clsx + tailwind-merge) for conditional class names.
- Form state: use React `useState` for simple forms, don't bring in a form library for V1.
- Loading states: use skeleton components or simple spinners, not complex loading UI.
- Error handling: catch errors, show toast notifications, don't let errors crash the page.

### Design System (Specter)

Design tokens are defined in `app/globals.css` using CSS custom properties with the `:root` + `@theme inline` pattern. This is a dark-theme-only app.

**Key token values (from globals.css):**

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#030712` (True Black) | Page background |
| `--foreground` | `#FFFFFF` | Primary text |
| `--primary` | `#068BD4` (Ghost Cyan) | Brand accent, links, active states |
| `--primary-foreground` | `#030712` | Text on primary backgrounds |
| `--card` | `#1F2937` | Card/surface backgrounds |
| `--muted-foreground` | `#9CA3AF` | Secondary/muted text |
| `--border` | `#374151` | Borders, dividers |
| `--destructive` | `#EF4444` | Error/danger states |
| `--ring` | `#068BD4` | Focus rings |

**Fonts:**
- **Display:** Clash Display (headings, brand moments)
- **Body:** Manrope (body text, UI elements)
- **Monospace:** JetBrains Mono (code, technical content)

**Do NOT use (these are from the old Cambrian brand):**
- Amber/gold accent (`#E8B931`)
- Die Grotesk A or Die Grotesk B fonts
- IBM Plex Mono
- `#0D0D0D` or `#141414` backgrounds
- `tailwind.config.ts` — Tailwind v4 uses CSS-based config

### Database Interactions

- Use Supabase JS client (`@supabase/supabase-js`) for all database operations.
- Client-side: use the anon key client from `lib/supabase/client.ts`.
- Server-side (API routes): use the server client from `lib/supabase/server.ts`.
- Always handle errors from Supabase calls. Check `.error` on every response.
- Use TypeScript types from `lib/types.ts`.

### API Route Patterns

All route handlers follow these conventions:

1. **Auth first:** `const supabase = await createClient()` → `supabase.auth.getUser()` → 401 if no user.
2. **Ownership checks:** Filter by `owner_id: user.id` when querying user-owned resources.
3. **Async params (Next.js 16):** `{ params }: { params: Promise<{ id: string }> }` with `const { id } = await params`.
4. **Request type:** Use standard `Request` (not `NextRequest`). Prefix unused request params with underscore: `_request: Request`.
5. **Response type:** `NextResponse.json()` for JSON. Raw `new Response()` for SSE streaming only.

### Claude API Architecture

The AI system has three layers:

1. **Engines** (`lib/claude/explore.ts`, `lib/claude/draft.ts`) — Build prompts, call models, return streams. Zero Supabase calls. Accept voice rules, sources, and API key as explicit params.
2. **Router** (`app/api/chat/route.ts`) — Auth, data fetching, voice resolution, engine dispatch, SSE formatting, message persistence. This is the integration layer that connects everything.
3. **Parsing** (`lib/claude/parse.ts`) — Extracts `<draft>` tags from responses, strips tags for display.

Voice rules, source data, and API keys are resolved by the router and passed as params to the engines. Engines never fetch their own data — this makes them testable and mode-agnostic.

### Git Practices

- Commit after each meaningful unit of work (a complete feature, a working component, a passing integration).
- Commit messages: short, imperative (`Add capture modal`, `Wire up Claude streaming`, `Fix bucket detail routing`).
- Don't commit broken code. If something isn't working, fix it or revert before moving on.

## Agent System

This project uses an **Opus orchestrator + Sonnet builder** model:

- **Orchestrator (Opus):** Plans, writes task briefs, tracks progress, ensures integration. Does NOT write application code. Lives in `orchestrator.md`.
- **Builder agents (Sonnet):** Execute task briefs. Own implementation details, follow integration contracts. See `builder-agent-guide.md` for full guidance.
- **Code review agent:** Reviews completed work across quality, security, integration, and architecture.

**Rules for builder agents:**
- Read `builder-agent-guide.md`, this file, and your task brief before starting.
- Stay within your task scope. Only modify files assigned to your task.
- If you need something from another task that hasn't been built yet, create a minimal stub and note the dependency.
- Match existing codebase patterns — check neighboring files before writing new ones.
- Verify: TypeScript compiles, no lint errors, all acceptance criteria met.
- Commit when done with a clear message.

## What "Done" Looks Like for V1

- [x] Two users can log in with email/password
- [x] Each user can set their Anthropic API key and voice profile
- [x] Users can capture sources (notes, links, voice memo transcripts) into inbox or directly into buckets
- [x] Users can create buckets and move sources between them
- [x] Sources are automatically embedded on creation
- [ ] Users can start a conversation within a bucket context
- [ ] Claude responds conversationally with full context of sources and voice profiles
- [ ] Claude can generate drafts that appear in a side panel
- [ ] Users can refine drafts through continued conversation
- [ ] Drafts can be copied to clipboard and marked with a status
- [ ] Both users can see each other's buckets, sources, and drafts
- [ ] Dashboard shows overview stats
- [ ] Explore mode: Opus brainstorms angles with semantically retrieved cross-bucket sources
- [ ] Draft mode: Sonnet writes platform-specific content from full Explore conversation context
- [ ] User explicitly selects Explore or Draft mode (no auto-detection)
- [ ] Repurposing works: same Explore conversation → switch platform → hit Draft again → new draft
- [ ] Users can see which sources were pulled into a conversation's context
- [ ] Deployed to Vercel and working
