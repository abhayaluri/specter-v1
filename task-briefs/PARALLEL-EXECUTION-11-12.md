# Parallel Execution Guide — Tasks 11 + 12

**Date:** 2026-02-07
**Status:** READY FOR DISPATCH

---

## Overview

Tasks 11 and 12 can run in **parallel** with zero conflicts. They touch completely separate files and have no shared dependencies beyond what's already built.

---

## Task 11 — Draft Management Page

**Brief:** `task-briefs/task-11-draft-management-page.md`
**Scope:** `/drafts` list page + `/drafts/[id]` detail page
**Files created:** 5 files in `app/drafts/*` and `components/drafts/*`
**Dependencies:** Task 10 ✅ COMPLETE (uses existing draft API routes)
**Estimated completion:** ~90 minutes

**What it builds:**
- Draft list page with filters (platform, status, bucket, search)
- Draft detail page with markdown editor, version history
- Reuses StatusBadge + VersionList from Task 10

**File ownership:**
```
app/drafts/page.tsx          ← Task 11
app/drafts/[id]/page.tsx     ← Task 11
components/drafts/*          ← Shared (Task 10 already created some, Task 11 adds more)
```

---

## Task 12 — Dashboard

**Brief:** `task-briefs/task-12-dashboard.md`
**Scope:** Landing page (`/`) with stats and quick links
**Files created/modified:** 1 page + 4 components in `components/dashboard/*`
**Dependencies:** Tasks 6, 7, 10 ✅ ALL COMPLETE
**Estimated completion:** ~75 minutes

**What it builds:**
- Stats cards (total sources, drafts by status, inbox count, bucket count)
- Bucket grid with counts
- Inbox preview (latest 5 sources)
- Recent conversations list

**File ownership:**
```
app/page.tsx                     ← Task 12
components/dashboard/*           ← Task 12
```

---

## Why Parallel Execution is Safe

| Concern | Resolution |
|---------|-----------|
| File conflicts? | **ZERO.** Task 11 owns `app/drafts/*`, Task 12 owns `app/page.tsx` and `components/dashboard/*`. No overlap. |
| Shared components? | Task 11 **imports** StatusBadge/VersionList from Task 10 (read-only). Task 12 **may import** BucketCard/SourceCard from Tasks 6+7 (read-only). No writes to shared files. |
| API conflicts? | Both tasks **consume** existing routes. Neither creates new routes. |
| Database conflicts? | Both tasks **read** from existing tables. No schema changes. |
| Merge conflicts? | Separate directories. Clean merge guaranteed. |

---

## Dispatch Instructions

### For Abhay:

**Option 1 — Sequential (safer, slower):**
1. Dispatch Task 11 builder → wait for completion
2. Dispatch Task 12 builder → wait for completion
3. Merge both (no conflicts)

**Option 2 — Parallel (faster, recommended):**
1. Spawn **two separate Claude Code instances**
2. Instance A: "Build Task 11 from `task-briefs/task-11-draft-management-page.md`"
3. Instance B: "Build Task 12 from `task-briefs/task-12-dashboard.md`"
4. Both builders work simultaneously (~90 min max)
5. Merge both branches (git will handle it cleanly)

**Recommended:** Option 2. These tasks are specifically designed for parallel execution with zero conflicts.

---

## After Completion

When both tasks are done:

1. Verify both builds run clean (`pnpm dev`, zero TS errors)
2. Manual smoke test:
   - `/drafts` shows draft list with filters
   - `/drafts/[id]` shows draft detail with editor
   - `/` (dashboard) shows stats, buckets, inbox, conversations
3. Commit both (or commit individually, then verify merge)
4. Update orchestrator.md (Tasks 11+12 → COMPLETE)
5. Write Task 13 brief (Realtime)

---

## Remaining Tasks After 11+12

```
✅ Tasks 0-10:  COMPLETE (16 tasks)
🚧 Tasks 11+12: IN PROGRESS (parallel)
📋 Task 13:     Realtime & Cross-User Visibility
📋 Task 14:     Keyboard Shortcuts & UX Polish
📋 Task 15:     Deploy to Vercel

After 11+12: 3 tasks remaining (17% of project)
```

---

## Notes

- Both briefs follow the brief-writing principles (tight interfaces, loose internals)
- Both are pattern-following tasks (~100-150 lines each)
- Both reuse existing components where appropriate
- Both follow Specter design system
- Both use shadcn/ui components
- Both follow Next.js 16 async params pattern
