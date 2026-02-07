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

**Phase:** Phase 1 (Auth & Layout) COMPLETE → Phase 2 (Data Layer & CRUD) READY

**What's done:**
- Created project folder, moved and renamed 3 source docs from Downloads
- Absorbed all project docs (PRD, architecture, CLAUDE.md)
- Established orchestrator system: orchestrator plans/tracks, Abhay spins up separate builder agents, code review agent checks work
- Created master implementation plan v1 (16 tasks, 5 phases)
- Reviewed doc-changes v1 (two-model architecture) — gave feedback, proposed phased approach
- Reviewed doc-changes v2 (three-agent pipeline) — adopted fully
- Applied all v2 changes via 3 parallel agents: PRD (7 edits), architecture (12 edits), CLAUDE.md (7 edits)
- Rewrote master plan v2: 20 tasks, three-agent pipeline, Task 2.5 (embeddings), Task 8 decomposed into 8a-8e sub-tasks
- Verified all changes landed correctly across all files
- Created `orchestrator.md` for orchestrator continuity across sessions
- Updated MEMORY.md to auto-load orchestrator context
- **Architecture simplification:** Reconciled all docs from three-agent pipeline to two-mode architecture (Explore + Draft). Killed auto mode detection, `<brief>` tag parsing, keyword heuristics. Collapsed Task 8 from 5 sub-tasks (8a-8e) to 3 (8a-8c). Renamed synthesis_model/drafting_model → explore_model/draft_model. Removed conversation_mode/current_brief/retrieved_source_ids columns. All 4 project docs now aligned on two-mode architecture.
- **Task briefs written:** Task 0 (Design System — Specter rebrand), Task 1 (Project Scaffolding), Task 1.5 (Specter Rebrand Implementation), Task 2 (Supabase Setup), Task 2.5 (pgvector & Embeddings), Task 3 (Authentication Flow), Task 4 (Layout Shell & Navigation), Task 4.5 (shadcn/ui Setup & Design Token Integration) briefs in `task-briefs/`
- **Doc fixes:** PRD font corrected (Die Grotesk A/B), `include_all_buckets` default flipped to `true`, `mode` column clarified as "last-used mode for UI restoration"
- **Task 0 COMPLETE (REBRAND):** `design-system.md` completely rewritten for Specter brand. Ghost Cyan accent (#068BD4), True Black bg (#030712), Clash Display + Manrope fonts. Full semantic color system (24 tokens), typography scale, spacing (8-point grid), component patterns (9 types), Tailwind v4 @theme config, font loading strategy. Replaces initial Cambrian design system.
- **Task 2 COMPLETE:** Supabase project live (fbjtjhyvuhcebyomvmsa, us-east-1). All 8 tables, RLS, triggers, match_sources(), pgvector, auth, 2 users — all verified. `.env.local` populated.
- **Task 1 COMPLETE:** Full Next.js 14 foundation built by Sonnet 4.5 builder agent. 57 files, 11,018 lines. Design system integrated (Tailwind config, fonts, colors), complete type system, folder structure, shared components. `pnpm dev` runs clean, TypeScript zero errors, git committed.
- **Task 3 COMPLETE:** Authentication flow implemented. Supabase clients (browser + server), auth middleware, login/signup page, logout, session management, route protection. Profile auto-creation verified. **Critical fix:** Migrated to Tailwind v4 CSS-based config (@theme directive). Commit 29905de, 8 files, 366 insertions.
- **Task 2.5 COMPLETE:** OpenAI embedding pipeline implemented. lib/embeddings.ts (embedText, embedBatch, truncation), /api/embed route (single/batch), test scripts (pnpm test:embeddings), backfill utility. All 3 tests passing, semantic search verified (52.4% similarity match via match_sources()). Commit 22c38b6, 5 files, 733 insertions.
- **Task 4 COMPLETE:** Layout shell & navigation. Sidebar with nav items (Inbox, Buckets, Conversations, Drafts, Settings), TopBar with user display, AppShell wrapper, responsive mobile menu, route highlighting, custom icons. 11 files, 410 insertions. Commit 3513296.
- **Task 1.5 + 4.5 COMPLETE (combined):** Specter rebrand + shadcn/ui setup in single session. Fonts swapped (Clash Display + Manrope + JetBrains Mono), logo copied, globals.css rewritten to `:root` + `@theme inline` shadcn pattern, all 11 components migrated to shadcn token names (bg-primary = Ghost Cyan, bg-background = True Black, bg-card = Charcoal, bg-accent = hover gray). tw-animate-css + lucide-react + class-variance-authority installed. Button component added. Build clean, tsc clean. Commit 8d0ccdc.

**What's next (SESSION 9 — MORNING PLAN):**

**Step 1: Visual polish (quick win)**
- Read `task-briefs/visual-polish-improvements.md` — it's a standalone builder brief
- Spin up a Sonnet builder to execute it (~30 min). Covers: typography tightening, sidebar contrast, card shadows/hover states, Ghost Cyan accent on nav, dramatic hero heading
- This makes the app look and feel like Specter before building real features on top

**Step 2: Content & data discovery interview**
- Before writing Task 5 + 6 briefs, the orchestrator MUST ask Abhay a series of questions to understand:
  - **Source types in practice:** What does Abhay actually capture day-to-day? Twitter threads, podcast timestamps, article highlights, meeting notes, voice memos? What's the most common?
  - **Example sources:** Can Abhay provide 5-10 real example sources (notes, links, clips) so the builder agent can seed the inbox with realistic test data?
  - **Voice profile content:** What does Abhay's personal voice sound like? What are the rules? (e.g., "Never use buzzwords", "Always use concrete examples", "Write like Paul Graham") What about Srikar's voice? Company voice?
  - **Platform priorities:** Which platforms matter most right now? LinkedIn first? Twitter/X? Long-form? What formats do they publish in?
  - **Bucket structure:** What thematic buckets would Abhay create? (e.g., "AI Infrastructure", "Founder Stories", "Market Analysis") — this helps Task 7 later
  - **Content workflow today:** How does Abhay currently go from idea → published content? What's the biggest bottleneck? What does "faster" mean concretely?
  - **Model preferences:** Default Opus for Explore and Sonnet for Draft? Any preferences on model versions?
  - **API key situation:** Does Abhay have an Anthropic API key yet? (Needed for Task 8)
- This interview ensures Tasks 5, 6, and 7 briefs are grounded in real workflows, not hypothetical ones

**Step 3: Write Task 5 + 6 briefs**
- Incorporate answers from the interview into detailed briefs
- Task 5 (Settings): Include realistic voice profile examples, platform configs
- Task 6 (Source Capture): Include example sources as seed data, realistic content types
- Both briefs should be rich enough that builder agents create a product that feels real, not generic

**Step 4: Execute Tasks 5 + 6 in parallel**
- Both are Sonnet-grade builder tasks
- Task 5: Settings page (API key, voice profiles, model selection)
- Task 6: Source Capture (modal, inbox, CRUD, auto-embedding)

- Abhay needs to: get Anthropic API key (before Task 8)

**Blocked on:**
- Nothing. Visual polish is ready. Tasks 5 and 6 need briefs (depends on Abhay interview).

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
| 5 | Settings (API Key + Voice + Models) | NOT STARTED | READY — deps complete (4.5) |
| 6 | Source Capture & Inbox | NOT STARTED | READY — deps complete (4.5, 2.5) |
| 7 | Bucket Management | NOT STARTED | Depends on 6 |
| 8a | Explore Mode (Retrieval + Synthesis) | NOT STARTED | Depends on 2.5, 5 |
| 8b | Draft Mode | NOT STARTED | Depends on 5 |
| 8c | Chat Router | NOT STARTED | Depends on 8a, 8b |
| 9 | Conversation UI | NOT STARTED | Depends on 8c, 7 |
| 10 | Draft Panel | NOT STARTED | Depends on 9 |
| 11 | Draft Management Page | NOT STARTED | Depends on 10 |
| 12 | Dashboard | NOT STARTED | Depends on 7, 6, 10 |
| 13 | Realtime & Cross-User | NOT STARTED | Depends on 12 |
| 14 | Polish & Shortcuts | NOT STARTED | Depends on 13 |
| 15 | Deploy to Vercel | NOT STARTED | Depends on 14 |

---

## Abhay Action Items

- [x] ~~Set up Supabase project~~ — DONE (2026-02-06)
- [x] ~~Get OpenAI API key for embeddings~~ — DONE (2026-02-06, Task 2.5 complete)
- [ ] Get Anthropic API key (needed before Task 8)

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

---

## For the Next Orchestrator

When Abhay spins you up, here's your startup sequence:

1. Read this file (`orchestrator.md`) completely
2. Check the "Current Status" section to understand where things stand
3. Check the "Task Status" table to see what's done/in-progress/blocked
4. Read `master-implementation-plan.md` for full task details
5. Ask Abhay: "I've read the orchestrator doc. Here's where we left off: [summary]. What do you want to tackle next?"
6. Before your session ends, **update this file**
