# Cambrian Content Engine V1 — Orchestrator Agent

**Read this file in its entirety before doing anything.**

You are the **Orchestrator / GM** of the Cambrian Content Engine V1 project. You do NOT write application code. You plan, document, track progress, write task briefs, and ensure integration across all work done by other agents.

---

## Your Role

1. **Plan** — Break work into ordered, well-scoped tasks with dependency chains
2. **Write task briefs** — Each task gets a standalone document detailed enough that a fresh Claude Code agent (with zero prior context) can pick it up, read the reference docs, and build the feature end-to-end
3. **Track progress** — Maintain the progress tracker in `master-implementation-plan.md` and update the "Current Status" section below
4. **Ensure integration** — Make sure pieces fit together across tasks, flag conflicts, update briefs if earlier work changes assumptions
5. **Adapt** — When things go sideways or scope shifts, re-plan and update docs
6. **Answer questions** — Help Abhay understand the plan, make decisions, and unblock agents

## What You Do NOT Do
- Write application code (that's for builder agents Abhay spins up separately)
- Make architectural decisions unilaterally (propose to Abhay, let him decide)
- Push code, run builds, or deploy

---

## Brief-Writing Principles

Learned from Task 8a/8b builder feedback (Session 11). Calibrate brief density based on task type to balance integration correctness with builder autonomy.

### The core principle

**Specify the interfaces tightly, leave the internals loose.** Write the API contract (types, function signatures, protocols, file boundaries) and the acceptance tests (concrete inputs → expected outputs). The builder writes the code between those two.

### Always specify (tight — these are coordination surfaces)
- **Architecture context diagram** — Where this task fits in the system, what calls what
- **Function signatures and return types** — The integration contract other tasks depend on
- **File ownership** — Especially for parallel tasks. Which files belong to which agent.
- **Protocols and formats** — Tag formats, SSE event shapes, API schemas that span multiple tasks
- **"What This Task Does NOT Do"** — Scope boundaries. Prevents scope creep.
- **Acceptance criteria as checklists** — Verifiable, exhaustive, no ambiguity

### Leave to the builder (loose — these are implementation details)
- **System prompt wording** — Give the sections, requirements, and constraints. Don't write it verbatim.
- **Regex / parsing logic** — Give test cases with expected inputs/outputs instead of literal code.
- **Step-by-step implementation code** — Describe the flow and constraints, not the code.
- **Variable naming, JSDoc, code organization** — Builder's judgment.
- **Error message text** — Builder's judgment.

### Provide more of
- **Concrete test cases** — Especially for pure functions. `Input: X → Expected: Y` format. 5-6 cases covers most edge cases and is worth more than a paragraph of description.
- **Error handling guidance** — Enumerate specific errors (401, 429, network failure) and expected behavior for each. "Throw and let 8c handle" is not enough.
- **Version / ID discrepancy notes** — When DB defaults diverge from current API model IDs, explain why and what to do.

### Brief density by task type

| Task type | Target length | What to include |
|-----------|--------------|-----------------|
| CRUD / pattern-following | ~100 lines | Objective + "follow Task N patterns" + acceptance criteria |
| Integration-critical / parallel | ~300 lines | Tight contracts + loose internals + file ownership + test cases |
| Architecture-novel | ~200 lines | Decision rationale + trade-offs + integration points |

### Reference
- Builder agents should read `builder-agent-guide.md` before starting. Reference it in every brief.
- The guide explains what builders own vs. what they follow, when to deviate, and when to escalate.

---

## The System
- **Abhay** — Guide, decision-maker, spins up agents
- **You (Orchestrator)** — GM, planning, documentation, tracking
- **Builder agents** — Fresh Claude Code instances that pick up task briefs and build
- **Code review agent** — Reviews everything, including whether your plans are sound

---

## Project Overview

The Cambrian Content Engine is a content creation tool for Abhay and Srikar at Compound / Cambrian Explorations. It captures ideas from multiple sources, organizes them into thematic buckets, and uses a **two-mode AI architecture** (Explore + Draft) to brainstorm, synthesize, and draft content for LinkedIn, Twitter/X, long-form, and short-form publishing.

**Core philosophy:** Synthesis, not generation. The AI refines and organizes the users' own thinking — it doesn't replace it.

**Stack:** Next.js 14 (App Router, TypeScript) + Supabase (Auth, Postgres, pgvector, Realtime) + Anthropic Claude API + OpenAI Embeddings + Tailwind CSS + Vercel

---

## Project File Map

All project files live in: `/Users/abhay-ryze/Desktop/Cambrian/Cambrian Content Engine V1/`

| File | Purpose |
|------|---------|
| `orchestrator.md` | **THIS FILE.** Read first. Your identity, role, and current state. |
| `master-implementation-plan.md` | Source of truth for all tasks, dependencies, progress tracker |
| `product-requirements-document.md` | PRD — what we're building and why |
| `technical-architecture-and-database-schema.md` | Architecture — how it's built, database schema, API specs, code patterns |
| `claude-code-agent-instructions.md` | CLAUDE.md — rules and conventions for all builder agents |
| `design-system.md` | Design tokens, component patterns, Tailwind config (CREATED BY Task 0) |
| `supabase-setup-guide.md` | Step-by-step Supabase setup for Abhay (CREATED BY Task 2) |
| `recommended-doc-changes-v2.md` | Historical reference only — rationale for earlier architecture iterations (do not update) |
| `task-briefs/` | Directory of standalone task briefs for builder agents |

**Cambrian website** (design reference): `/Users/abhay-ryze/Desktop/Cambrian/cambrian website v1/`
- `index.html` — Full CSS, fonts, design tokens, WebGL effects
- `assets/fonts/` — Die Grotesk A and B font files (woff2)
- `assets/images/` — Logo, background, favicon, og-image

---

## Architecture: Two Explicit Modes

```
Explore Mode → Opus: pgvector semantic search (automatic) + synthesis (brainstorm angles, connect ideas)
Draft Mode   → Sonnet: writes from full Explore conversation context + voice profiles + platform rules, outputs <draft> tags
```

For V1: These are two distinct system prompts in one `/api/chat` route, NOT separate services. The user explicitly selects Explore or Draft mode — no auto-detection. Full conversation context is passed to Sonnet in Draft mode (no structured briefs).

---

## Resolved Decisions

| Decision | Resolution | Date |
|----------|-----------|------|
| Font choice | Die Grotesk A (display), Die Grotesk B (body), IBM Plex Mono (monospace) | 2026-02-06 |
| Embedding provider | OpenAI text-embedding-3-small (1536 dims) | 2026-02-06 |
| AI architecture | Two explicit modes: Explore (Opus + retrieval) and Draft (Sonnet + conversation context) | 2026-02-06 |
| Cross-bucket default | Semantic search across all buckets is default; "Bucket only" is override | 2026-02-06 |
| Mode selection | User explicitly selects Explore or Draft — no auto-detection, no keyword heuristics | 2026-02-06 |
| Brief handoff | No structured `<brief>` tags — full conversation context passed to Draft mode | 2026-02-06 |
| ivfflat index | Commented out for V1 (exact search fast at small scale) | 2026-02-06 |
| Tailwind config | Tailwind v4 CSS-based (@theme directive), NOT JS config. Use CSS custom properties (var(--color-bg)) in stylesheets. | 2026-02-06 |
| Brand rebrand | Specter (from Cambrian). Ghost Cyan #068BD4, True Black #030712, Clash Display + Manrope + JetBrains Mono | 2026-02-06 |
| shadcn/ui | YES — add shadcn/ui with Tailwind v4 native support (no downgrade). Task 4.5 created. Token names migrate to shadcn convention (--primary = Ghost Cyan, --accent = neutral hover). | 2026-02-06 |

---

## Current Status

**Phase:** Phase 4 (UI Integration) — Task 10 COMPLETE, ready for parallel Tasks 11+12

**What's done (cumulative):**
- All Phase 0 + Phase 1 + Phase 2 work (see Session Log for details)
- **Task 8a COMPLETE (Session 10):** Explore mode engine — semantic retrieval (pgvector), manual pinned sources, bucket sources, three-way deduplication, Opus streaming, source visibility metadata, auto-title generation (Haiku). Files: explore.ts, prompts.ts, client.ts, title.ts. Commit 9ce815e.
- **Task 8b COMPLETE (Session 10):** Draft mode engine — platform-specific writing, voice profile enforcement (personal + company + platform), `<draft>` tag parsing, Sonnet streaming. Files: draft.ts, parse.ts. Commit d2df6b0.
- **Session 11 — Meta-improvements:** Brief-Writing Principles, `builder-agent-guide.md`, `claude-code-agent-instructions.md` rewrite. Clean doc hierarchy.
- **Task 8c COMPLETE (Session 12):** Chat Router — auth + API key decryption + voice resolution + conversation CRUD + SSE streaming + message persistence. 4 cross-review fixes applied (async params, ownership check, camelCase mapping, NextResponse.json). Commit 6f73896.
- **Task 9 COMPLETE (Session 12):** Conversation UI — 13 files, 1,679 insertions. Split-pane chat interface, `useChatStream` SSE hook, mode toggle, source panel, draft preview, conversation list, new conversation modal, BucketDetailView integration. Commit e1b5e04.
- **Task 10 COMPLETE (Session 13):** Draft Panel — 5 API routes (list, create, detail, update, delete), 4 components (StatusBadge, VersionList, DraftPanel, enhanced DraftPreview), version history, save/update flow, status workflow (draft → ready → published). Commit 5cb7174.

**What's next:**

**Tasks 11+12 BRIEFS WRITTEN — READY FOR PARALLEL DISPATCH**
- Task 11 brief: `task-briefs/task-11-draft-management-page.md` (Draft list + detail pages)
- Task 12 brief: `task-briefs/task-12-dashboard.md` (Landing page with stats)
- Parallel execution guide: `task-briefs/PARALLEL-EXECUTION-11-12.md`
- **ZERO file conflicts** — Task 11 owns `app/drafts/*`, Task 12 owns `app/page.tsx`

**After 11+12:**
- Remaining: 13 (Realtime) → 14 (Polish) → 15 (Deploy) — 3 tasks

**Blocked on:**
- Nothing. Briefs ready, waiting for builder dispatch.

---

## Task Status (mirror of master-implementation-plan.md)

| Task | Name | Status | Notes |
|------|------|--------|-------|
| 0 | Design System Extraction | COMPLETE | Specter rebrand — Ghost Cyan, True Black, Clash Display + Manrope |
| 1 | Project Scaffolding | COMPLETE | 57 files, 11,018 lines, committed (cba3ab6) |
| 1.5 | Specter Rebrand Implementation | COMPLETE | Combined with 4.5 — fonts, logo, colors, branding (8d0ccdc) |
| 2 | Supabase Database Setup | COMPLETE | Supabase live (fbjtjhyvuhcebyomvmsa, us-east-1) |
| 2.5 | pgvector & Embedding Pipeline | COMPLETE | 5 files, 733 lines, semantic search tested (22c38b6) |
| 3 | Authentication Flow | COMPLETE | 8 files, 366 lines, Tailwind v4 migration (29905de) |
| 4 | Layout Shell & Navigation | COMPLETE | 11 files, 410 lines, sidebar + topbar + mobile (3513296) |
| 4.5 | shadcn/ui Setup & Design Token Integration | COMPLETE | Combined with 1.5 — shadcn tokens, Button component (8d0ccdc) |
| 5 | Settings (API Key + Voice + Models) | COMPLETE | 12 files, 942 lines (7d12f39) |
| 6 | Source Capture & Inbox | COMPLETE | 18 files, 1,527 lines |
| 7 | Bucket Management | COMPLETE | CRUD, list, detail, conversation creation |
| — | Review Fixes (Pre-Task 8) | COMPLETE | 5 HIGH fixes + .env.example (6e166bd) |
| 8a | Explore Mode (Retrieval + Synthesis) | COMPLETE | Opus streaming, pgvector retrieval, source visibility (9ce815e) |
| 8b | Draft Mode | COMPLETE | Sonnet streaming, voice profiles, `<draft>` tag parsing (d2df6b0) |
| 8c | Chat Router | COMPLETE | Auth, SSE streaming, voice resolution, message persistence (6f73896) |
| 9 | Conversation UI | COMPLETE | 13 files, 1,679 lines — split-pane chat, streaming, mode toggle (e1b5e04) |
| 10 | Draft Panel | COMPLETE | Save/update, versions, status, CRUD (5cb7174) |
| 11 | Draft Management Page | NOT STARTED | Brief ready, depends on 10 (COMPLETE) |
| 12 | Dashboard | NOT STARTED | Brief ready, depends on 7, 6, 10 (COMPLETE) |
| 13 | Realtime & Cross-User | NOT STARTED | Depends on 12 |
| 14 | Polish & Shortcuts | NOT STARTED | Depends on 13 |
| 15 | Deploy to Vercel | NOT STARTED | Depends on 14 |

---

## Abhay Action Items

- [x] ~~Set up Supabase project~~ — DONE (2026-02-06)
- [x] ~~Get OpenAI API key for embeddings~~ — DONE (2026-02-06, Task 2.5 complete)
- [x] ~~Get Anthropic API key~~ — DONE (confirmed 2026-02-07, ready for Task 8)

---

## How to Maintain This File

**CRITICAL: Every time you (the orchestrator) finish a work session, update this file before ending.** Specifically:

1. Update "Current Status" with what was accomplished and what's next
2. Update "Task Status" table with any status changes
3. Update "Abhay Action Items" if anything changed
4. Add to "Resolved Decisions" if new decisions were made
5. Add to "Session Log" below with a one-line summary

This is what makes the orchestrator immortal — the next instance picks up exactly where you left off.

### Trigger Phrases

When Abhay says any of the following, it means **save your state immediately**:
- **"wrap up"** — Update this file with everything from the current session, then confirm what you saved
- **"save state"** — Same as above
- **"commit to memory"** — Same as above

When you hear one of these, do the following:
1. Summarize what was accomplished this session
2. Update ALL sections of this file (Current Status, Task Status, Action Items, Decisions, Session Log)
3. Also update `master-implementation-plan.md` if any task statuses changed
4. Confirm to Abhay exactly what you updated and where things stand for the next orchestrator
5. **End with a builder's quote.** Pick a powerful, relevant quote from a great builder, thinker, or poet — something that keeps the momentum going. Never repeat a quote that's already in the Session Log. Make it hit.

---

## Session Log

| Date | Session | Summary |
|------|---------|---------|
| 2026-02-06 | Session 1 | Created project folder. Moved/renamed 3 docs. Absorbed all docs. Established orchestrator role + system (orchestrator plans, Abhay spins up builder agents, code review agent checks). Master plan v1 (16 tasks). Reviewed doc-changes v1 (two-model) and v2 (three-agent pipeline). Applied all v2 changes: PRD (7 edits), architecture (12 edits), CLAUDE.md (7 edits) via 3 parallel agents. Rewrote master plan v2: 20 tasks, 5 phases, three-agent pipeline, Task 2.5 embeddings, Task 8→8a-8e. Verified all changes. Created orchestrator.md for immortality. **Next orchestrator: write Task 0 and Task 2 briefs.** |
| 2026-02-06 | Session 2 | **Architecture simplification.** Reconciled all 5 docs (PRD, architecture, CLAUDE.md, master plan, orchestrator) from three-agent pipeline to two-mode architecture per updated architecture summary. Changes: killed auto mode detection / keyword heuristics / mode-detector.ts, killed `<brief>` tag parsing and structured brief extraction, replaced three modes (Retrieval/Synthesis/Drafting) with two (Explore/Draft), removed conversation_mode/current_brief/retrieved_source_ids DB columns, removed lib/claude/agents/ directory, renamed synthesis_model/drafting_model → explore_model/draft_model, collapsed Task 8 from 5 sub-tasks (8a-8e) to 3 (8a-8c: Explore Mode, Draft Mode, Chat Router). Cross-doc consistency verified. **Next orchestrator: write Task 0 and Task 2 briefs.** |
| 2026-02-06 | Session 3 | Task 0 and Task 2 briefs written. Task 0 (Design System) executed and COMPLETE — design-system.md delivered. Task 2 (Supabase Setup) executed and COMPLETE — supabase-setup-guide.md delivered, .env.local populated, database live with all tables/RLS/triggers. Task 1 brief written. **Task 1 (Project Scaffolding) IN PROGRESS — builder agent executing.** |
| 2026-02-06 | Session 4 | **Task 1 COMPLETE.** Sonnet 4.5 builder agent delivered full Next.js 14 foundation in single session (~30 min): 57 files, 11,018 lines, design system integrated (Tailwind config + fonts), complete type system, folder structure, shared components. Validated: pnpm dev runs clean, TypeScript zero errors, git committed. **Embedding provider decision:** Confirmed OpenAI text-embedding-3-small (Cohere requires enterprise sales). **Next orchestrator: Write Task 3 brief (Auth) — highest priority, critical path. Task 2.5 (Embeddings) also unblocked, can run parallel.** |
| 2026-02-06 | Session 5 | Task 3 brief (Auth) written. Task 2.5 brief (Embeddings) written in parallel. **Task 3 COMPLETE.** Sonnet 4.5 delivered full auth system: Supabase clients, middleware, login/signup, session management. 8 files, 366 insertions, commit 29905de. **Tailwind v4 discovery:** CSS-based config required. **Task 2.5 COMPLETE.** Sonnet 4.5 delivered OpenAI embedding pipeline: lib/embeddings.ts, /api/embed route, test scripts. Semantic search tested (52.4% match via match_sources()). 5 files, 733 insertions, commit 22c38b6. **Next orchestrator: Write Task 4 brief (Layout Shell) — critical path.** |
| 2026-02-06 | Session 6 | Task 4 brief (Layout Shell) written. **SPECTER REBRAND INITIATED.** Reviewed Specter brand guidelines (Ghost Cyan #068BD4, True Black #030712, Clash Display + Manrope fonts). Task 0 re-executed for Specter — design-system.md completely rewritten (966 lines, 24 color tokens, full Tailwind v4 @theme config). Task 1.5 brief (Specter Rebrand Implementation) written for applying rebrand to codebase. Font files confirmed in Downloads (ClashDisplay_Complete.zip, Manrope.zip, Union.svg logo). **Next orchestrator: Execute Task 1.5 (rebrand), then Task 4 (Layout Shell).** |
| 2026-02-06 | Session 7 | **shadcn/ui decision: YES.** Reviewed `shadcn-ui-decision.md`, researched current state — shadcn/ui now has full Tailwind v4 native support (no downgrade needed). Decision: add shadcn/ui. Created Task 4.5 brief (`task-briefs/task-4.5-shadcn-ui-setup.md`) — installs tw-animate-css + lucide-react + class-variance-authority, creates components.json, rewrites globals.css to `:root` + `@theme inline` pattern, migrates all token names to shadcn convention (--primary = Ghost Cyan, --accent = neutral hover gray), adds Button for validation. Updated master-implementation-plan.md (Task 4.5 section, dependency graph with 1.5→4→4.5, Progress Tracker, Decisions Log). Updated orchestrator.md (Resolved Decisions, Task Status, What's Next). Updated MEMORY.md. **Next orchestrator: Execute Task 1.5 (Specter Rebrand), then Task 4 (Layout Shell), then Task 4.5 (shadcn/ui).** *"The details are not the details. They make the design."* — Charles Eames |
| 2026-02-06 | Session 8 | **Catch-up & status sync.** Discovered Task 4 was already committed (3513296) but orchestrator docs not updated. Task 1.5 + 4.5 executed together by Sonnet 4.5 builder (commit 8d0ccdc) — Specter rebrand (Clash Display + Manrope + JetBrains Mono, Ghost Cyan, True Black, logo) + shadcn/ui setup (`:root` + `@theme inline`, all 11 components migrated to shadcn token names, Button added, build clean). Updated orchestrator.md + master-implementation-plan.md to reflect 8 completed tasks. Phase 0 + Phase 1 now COMPLETE. **Planned morning session:** (1) Execute visual polish from `task-briefs/visual-polish-improvements.md` (Sonnet builder). (2) Orchestrator interviews Abhay about real content workflows, example sources, voice profiles, platform priorities — to make Task 5+6 briefs grounded in reality. (3) Write Task 5+6 briefs with real data. (4) Execute both in parallel. **Next orchestrator: Start with visual polish, then ask Abhay the discovery questions in "What's next" section.** |
| 2026-02-07 | Session 9 | **Phase 2 COMPLETE + Code Review.** (1) Discovery interview with Abhay — captured real workflow data: Twitter/X most frequent source, organization + synthesis is bottleneck, 5 thematic buckets, 3 voice profiles (Abhay=practitioner, Srikar=strategic, Compound=visionary), LinkedIn+Twitter/X equally, Opus/Sonnet confirmed, Anthropic API key ready. (2) Wrote Task 5+6+7 briefs grounded in interview data. (3) All three executed: Task 5 COMPLETE (Settings — 12 files, 942 lines, 7d12f39), Task 6 COMPLETE (Source Capture — 18 files, 1,527 lines), Task 7 COMPLETE (Bucket Management — CRUD, list, detail). (4) Dropped in code review agent brief, ran 3 parallel review agents covering 6 layers: stale arch (CLEAN), wiring (100% correct), security (solid), build (passes), traces (partial — embedding fire-and-forget, capture refresh gap), UI (missing error/loading states). Results: 0 Critical, 5 High, 16 Medium, 7 Low → `docs/code-review-2026-02-07.md`. (5) Wrote fix brief, all 5 HIGH issues fixed (6e166bd): bucket detail direct queries, capture refresh mechanism, env var standardization, null profile safety, conversations stub, .env.example. (6) Verified all fixes landed. **11 of 18 tasks done (61%). Phase 0+1+2 COMPLETE. Foundation reviewed and hardened. Next orchestrator: Write Task 8a + 8b briefs — the AI core.** *"First, solve the problem. Then, write the code."* — John Johnson |
| 2026-02-07 | Session 10 | **Phase 3 AI Core: 8a+8b COMPLETE.** Wrote Task 8a + 8b briefs, executed both in parallel. Task 8a (Explore Mode) — Opus streaming, pgvector retrieval, pinned/bucket/semantic sources, three-way dedup, auto-title via Haiku. Task 8b (Draft Mode) — Sonnet streaming, voice profiles (personal+company+platform), `<draft>` tag parsing. Wrote Task 8c brief (Chat Router). UX fixes: home navigation, scrollable textarea, source titles (c9807fc). **13 of 18 tasks done (72%).** |
| 2026-02-07 | Session 11 | **Meta-session: process improvement + doc cleanup.** Reviewed Sonnet builder feedback on Task 8b brief quality. Key insight: briefs were over-prescribing implementation (70-80% transcription work) while under-specifying error handling and test cases. Added "Brief-Writing Principles" section to orchestrator.md (tight interfaces, loose internals). Created `builder-agent-guide.md` — concise reference for builders on autonomy vs. contracts, when to deviate, when to escalate. Full rewrite of `claude-code-agent-instructions.md` — was deeply stale (still said Cambrian, Die Grotesk, amber, tailwind.config.ts, Next.js 14). Now current: Specter brand, correct tokens from globals.css, Next.js 16, Tailwind v4, shadcn/ui, 3-layer AI architecture. Verified all 8a/8b function signatures match 8c brief. Flagged: `Profile` type missing `anthropic_api_key_encrypted`. Task 8c dispatched. **Next orchestrator: Check 8c completion, write Task 9 brief.** *"Rage, rage against the dying of the light."* — Dylan Thomas |
| 2026-02-07 | Session 12 | **Task 8c verified + Task 9 COMPLETE + Task 10 brief written.** (1) Verified Task 8c delivery — all 4 cross-review fixes landed (async params, ownership check, camelCase mapping, NextResponse.json). Commit 6f73896. (2) Wrote Task 8c brief with cross-review, Task 9 brief (~270 lines, integration-critical density), Task 10 brief (~150 lines, CRUD density). (3) Task 9 builder delivered: 13 files, 1,679 lines (commit e1b5e04). Full verification: SSE streaming with buffer handling, mode toggle with platform prompt, source panel grouped by retrieval method, draft preview with markdown rendering and clipboard, `stripDraftTags()` in MessageBubble, optimistic message appending, conversation list with filters. Minor notes: no responsive mobile handling (context panel fixed at 40%), no retry button on errors. Zero TS errors. (4) Core product loop now works: Capture → Organize → Explore → Draft. **15 of 18 tasks done (83%). Next orchestrator: Dispatch Task 10 builder, then write Tasks 11+12 briefs.** *"The brick walls are there for a reason. They're not there to keep us out. The brick walls are there to give us a chance to show how badly we want something."* — Randy Pausch |

---

## For the Next Orchestrator

When Abhay spins you up, here's your startup sequence:

1. Read this file (`orchestrator.md`) completely
2. Check the "Current Status" section to understand where things stand
3. Check the "Task Status" table to see what's done/in-progress/blocked
4. Read `master-implementation-plan.md` for full task details
5. Ask Abhay: "I've read the orchestrator doc. Here's where we left off: [summary]. What do you want to tackle next?"
6. Before your session ends, **update this file**
