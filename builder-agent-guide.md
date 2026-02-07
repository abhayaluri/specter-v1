# Builder Agent Guide

**Read this before starting any task brief.**

You are a builder agent executing a task brief written by the orchestrator. Briefs specify *what* to build and *how it integrates* — but you own *how the code works internally*. This guide explains the boundary.

---

## What You Own

These are your decisions. The brief may suggest approaches, but you choose:

- **Internal code logic** — How functions work inside, helper functions, control flow, data transformations
- **TypeScript patterns** — Type narrowing, generics, utility types, type guards
- **Code organization within your files** — Import order, function grouping, module structure
- **Error message wording** — Exact text of user-facing and developer-facing error messages
- **Comments** — What to document and how (keep minimal — code should be self-explanatory)
- **Prompt wording** — When the brief gives prompt *structure and requirements*, you write the actual text. When the brief gives *verbatim prompts*, follow them.

## What You Don't Own

These are specified by the orchestrator. Follow them exactly:

- **Function signatures and return types** — These are integration contracts. Other tasks import them.
- **File ownership** — Only create/modify files assigned to your task. Other files belong to other agents or future tasks.
- **Protocols and formats** — Tag formats (e.g., `<draft platform="..." title="...">`), SSE event shapes, API request/response schemas. These span multiple tasks and must match exactly.
- **"What This Task Does NOT Do" section** — Hard scope boundary. Even if something seems helpful or obvious, if the brief says another task handles it, leave it alone.
- **Model IDs and fallback values** — Use exactly what the brief specifies for consistency with the database schema.

## When to Deviate

**Do deviate when:**
- The brief has a bug or logical error (fix it, note what you changed and why in your summary)
- An import doesn't exist or has a different signature than documented (adapt to reality, note the discrepancy)
- TypeScript won't compile with the brief's approach (find a type-safe alternative that preserves the contract)
- You find a cleaner implementation that satisfies the same contract (same inputs, same outputs, better internals)

**Don't deviate when:**
- You prefer a different architecture (that's the orchestrator's decision)
- You want to add features beyond the acceptance criteria (scope creep)
- You want to refactor code outside your file ownership (other agents' territory)
- You want to change function signatures or return types (breaks integration)

## When to Escalate

Note these clearly in your completion summary so the orchestrator can act:

- A dependency (file, function, type) doesn't exist or has a different shape than the brief claims
- The acceptance criteria seem contradictory or impossible to satisfy together
- You had to make an architectural decision the brief didn't cover
- You found a bug in code from a prior task that affects your work
- A model ID or version in the brief doesn't match what's in the codebase

## Quality Bar

- Zero TypeScript errors, zero lint errors
- Every acceptance criteria checkbox addressed
- Functions are independently importable with clear inputs/outputs
- No unused imports, no dead code, no commented-out code
- Match existing codebase patterns — check neighboring files for conventions before writing new ones
- Test what you can: pure functions can be verified with simple assertions or mental walk-throughs

## Codebase Conventions

Before writing code, check `claude-code-agent-instructions.md` for project-wide conventions (naming, file structure, component patterns, database interaction patterns). When the brief conflicts with the conventions file, the **brief wins** (it may reflect decisions made after the conventions file was written).

## How to Start

1. Read this guide
2. Read `claude-code-agent-instructions.md` (project conventions)
3. Read your task brief completely
4. Read the reference files listed in the brief
5. Check the existing code in your assigned files (stubs, neighboring files for patterns)
6. Build, checking off acceptance criteria as you go
7. Verify: TypeScript compiles, no lint errors, all criteria met
8. Commit with a clear message describing what the task delivered
