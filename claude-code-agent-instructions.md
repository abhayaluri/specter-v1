# CLAUDE.md — Cambrian Content Engine

## Project Overview

This is the Cambrian Content Engine, a content creation tool for a two-person team (Abhay and Srikar) at Compound / Cambrian Explorations. It captures ideas from multiple sources, organizes them into thematic buckets, and uses conversational AI (Claude) to brainstorm, synthesize, and draft content for LinkedIn, Twitter/X, long-form, and short-form publishing.

**This is a weekend build. Ship fast, iterate later. Favor working software over perfect architecture.**

## Key Documents

- `docs/prd.md` — Full product requirements document. The source of truth for what we're building.
- `docs/architecture.md` — Technical architecture, database schema, folder structure, API patterns, component conventions.

Read both before doing anything.

## Stack

- **Framework:** Next.js 14, App Router, TypeScript
- **Styling:** Tailwind CSS (dark theme)
- **Database & Auth:** Supabase (Postgres + Auth + Realtime)
- **AI:** Anthropic Claude API (Messages endpoint, streaming)
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
8. **Two explicit modes (Explore + Draft).** The user explicitly selects a mode — no auto-detection. **Explore mode** (Opus) combines retrieval (pgvector semantic search) with synthesis (brainstorming angles, connecting ideas). **Draft mode** (Sonnet) writes platform-specific content using the full Explore conversation as context. Edit is just an editable textarea on the draft, not a separate AI mode. These are two distinct system prompts in `lib/claude/prompts.ts`, NOT separate services. The `/api/chat` route reads the mode from the request and routes to the right prompt + model.
9. **Sources are embedded on creation.** Every source gets an embedding vector stored via pgvector. Explore mode uses semantic search to find relevant sources across all buckets, not just the current bucket. Don't assume sources are only accessible within their bucket context.
10. **Full conversation context for Draft mode.** Instead of parsing structured briefs from `<brief>` tags, the full Explore conversation history is passed as context to Sonnet in Draft mode. Less token-efficient but zero parsing failure risk. Repurposing works by keeping the same Explore conversation and switching the target platform before hitting Draft again.

## Conventions

### File & Folder Structure

```
app/
  layout.tsx              # Root layout (nav, providers)
  page.tsx                # Dashboard (home)
  login/page.tsx          # Auth
  inbox/page.tsx          # Inbox view
  buckets/
    page.tsx              # Bucket list
    [id]/page.tsx         # Bucket detail
  conversations/
    [id]/page.tsx         # Conversation view (split pane)
  drafts/
    page.tsx              # Draft list
    [id]/page.tsx         # Draft detail
  settings/page.tsx       # API key, voice profiles
  api/
    chat/route.ts         # Claude API proxy (streaming)
    sources/route.ts      # Source CRUD
    buckets/route.ts      # Bucket CRUD
    drafts/route.ts       # Draft CRUD
    settings/route.ts     # API key encryption/storage
components/
  ui/                     # Reusable primitives (Button, Input, Modal, etc.)
  chat/                   # Chat thread, message bubbles, input
  drafts/                 # Draft panel, version list, status badge
  sources/                # Source cards, capture modal
  buckets/                # Bucket cards, bucket detail
  layout/                 # Nav, sidebar, split-pane container
lib/
  supabase/
    client.ts             # Browser Supabase client
    server.ts             # Server Supabase client (service role)
    middleware.ts          # Auth middleware
  claude/
    client.ts             # Anthropic API client setup
    prompts.ts            # Two system prompt builders (explore, draft)
    parse.ts              # Draft extraction from Claude responses
  encryption.ts           # API key encrypt/decrypt
  types.ts                # Shared TypeScript types
  utils.ts                # Helpers
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

### Tailwind Theme

The design language from the existing prototype. Configure in `tailwind.config.ts`:

```
colors: {
  bg: '#0D0D0D',
  surface: '#161616',
  'surface-hover': '#1E1E1E',
  border: '#2A2A2A',
  'border-light': '#333333',
  text: '#E8E6E3',
  'text-muted': '#8A8A8A',
  'text-dim': '#5A5A5A',
  accent: '#E8B931',
  'accent-dim': '#E8B93122',
  danger: '#D4594E',
  success: '#4A9B6F',
}
fontFamily: {
  sans: ['Die Grotesk B', ...defaultTheme.fontFamily.sans],
  display: ['Die Grotesk A', ...defaultTheme.fontFamily.sans],
  mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
}
```

### Database Interactions

- Use Supabase JS client (`@supabase/supabase-js`) for all database operations.
- Client-side: use the anon key client from `lib/supabase/client.ts`.
- Server-side (API routes): use the service role client from `lib/supabase/server.ts`.
- Always handle errors from Supabase calls. Check `.error` on every response.
- Use TypeScript types generated from Supabase or manually defined in `lib/types.ts`.

### Claude API Integration

- All Claude API calls go through `app/api/chat/route.ts`.
- The route handler:
  1. Gets the user's session (verify auth)
  2. Fetches and decrypts the user's Anthropic API key
  3. Reads `mode` from request body (`explore` or `draft` — user selects explicitly)
  4. Routes to the appropriate mode with the correct system prompt and model
  5. Explore: semantic search via pgvector for relevant sources, calls Opus with explore prompt
  6. Draft: passes full conversation context + voice profiles + platform rules, calls Sonnet with draft prompt, extracts `<draft>` tags
  7. Streams response back to client as SSE
  8. Saves messages to DB after stream completes
- Client-side: use `fetch` with streaming response handling. Parse SSE events.
- Draft content extraction: Claude wraps drafts in `<draft>` tags. The client parses these out and updates the draft panel. See `docs/architecture.md` for the parsing logic.

### Git Practices

- Commit after each meaningful unit of work (a complete feature, a working component, a passing integration).
- Commit messages: short, imperative (`Add capture modal`, `Wire up Claude streaming`, `Fix bucket detail routing`).
- Don't commit broken code. If something isn't working, fix it or revert before moving on.

## Agent Workflow

This project is built using multiple Claude Code agents:

1. **Planning Agent:** Reads PRD + CLAUDE.md + architecture.md and produces a detailed implementation plan with task breakdown, file specs, and dependency order. Saves the plan to `docs/implementation-plan.md`.
2. **Orchestrator Agent:** Reads the implementation plan and delegates tasks to sub-agents. Responsible for ensuring tasks are completed in the right order and that integration between features works.
3. **Sub-Agents:** Each handles a scoped task from the implementation plan. They read CLAUDE.md + architecture.md + their specific task brief, then build.

**Rules for sub-agents:**
- Read CLAUDE.md and `docs/architecture.md` before starting.
- Stay within your task scope. Don't refactor other features.
- If you need something from another task that hasn't been built yet, create a minimal stub/interface and note the dependency.
- Test your work. At minimum, verify the page loads and core interactions work.
- Commit when done.

## What "Done" Looks Like for V1

- [ ] Two users can log in with email/password
- [ ] Each user can set their Anthropic API key and voice profile
- [ ] Users can capture sources (notes, links, voice memo transcripts) into inbox or directly into buckets
- [ ] Users can create buckets and move sources between them
- [ ] Users can start a conversation within a bucket context
- [ ] Claude responds conversationally with full context of sources and voice profiles
- [ ] Claude can generate drafts that appear in a side panel
- [ ] Users can refine drafts through continued conversation
- [ ] Drafts can be copied to clipboard and marked with a status
- [ ] Both users can see each other's buckets, sources, and drafts
- [ ] Dashboard shows overview stats
- [ ] Sources are automatically embedded on creation
- [ ] Explore mode: Opus brainstorms angles with semantically retrieved cross-bucket sources
- [ ] Draft mode: Sonnet writes platform-specific content from full Explore conversation context
- [ ] User explicitly selects Explore or Draft mode (no auto-detection)
- [ ] Repurposing works: same Explore conversation → switch platform → hit Draft again → new draft
- [ ] Users can see which sources were pulled into a conversation's context
- [ ] Deployed to Vercel and working
