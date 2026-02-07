# Task 11 — Draft Management Page

**Status:** READY
**Dependencies:** Task 10 (Draft Panel) — needs draft CRUD API routes
**Agent type:** Builder

---

## Objective

Build the standalone `/drafts` page where users can browse, filter, and manage all their saved drafts outside of conversation context. This is the "library view" for drafts — complementing the in-conversation DraftPanel from Task 10.

After this task, users can: view all drafts in one place → filter by platform/status/bucket → open draft detail → edit content → change status → view version history.

---

## Architecture Context

```
Navigation → "Drafts" link
    ↓
/drafts (list page) — all user's drafts with filters
    ↓
Click draft card
    ↓
/drafts/[id] (detail page) — full draft view with inline markdown editor
    ↓
Edit content → PATCH /api/drafts/[id] (Task 10 route)
    ↓
Version increments, saved to draft_versions
```

**Key concept:** This task consumes Task 10's API routes. No new API routes needed. Focus is 100% on UI/UX for browsing and managing the draft library.

---

## What This Task Does NOT Do

- **NOT creating new drafts** — that happens in conversation (Task 9+10)
- **NOT the conversation UI** — that's Task 9
- **NOT the draft panel in conversation** — that's Task 10
- **NOT draft API routes** — those exist in Task 10

This task is ONLY the two pages: `/drafts` (list) and `/drafts/[id]` (detail).

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/drafts/page.tsx` | Draft list page with filters |
| `app/drafts/[id]/page.tsx` | Draft detail page with markdown editor |
| `components/drafts/DraftCard.tsx` | Draft preview card for list view |
| `components/drafts/DraftFilters.tsx` | Filter controls (platform, status, bucket) |
| `components/drafts/DraftEditor.tsx` | Inline markdown editor for detail view |

**File ownership (parallel execution):** This task owns `app/drafts/*`. Task 12 owns `app/page.tsx` (dashboard). No conflicts.

---

## Page Contracts

### `/drafts` — Draft List Page

**Layout:**
- Page header: "Drafts" title + draft count
- Filter bar: platform dropdown, status dropdown, bucket dropdown, search input
- Grid of draft cards (3 columns on desktop, 1 on mobile)
- Empty state: "No drafts yet. Start a conversation in a bucket to create your first draft."

**Draft Card (DraftCard component):**
- Title (truncate to 2 lines)
- Platform badge (from PLATFORM_CONFIG — LinkedIn, Twitter/X, etc.)
- Status badge (from StatusBadge component in Task 10)
- Content preview (first 2-3 lines, stripped of markdown)
- Timestamp (relative, e.g., "2 hours ago")
- Click → navigate to `/drafts/[id]`

**Filters (DraftFilters component):**
- Platform: All | LinkedIn | Twitter/X | Long-form | Short-form
- Status: All | Draft | Ready | Published
- Bucket: All | [bucket names from user's buckets]
- Search: filter by title (client-side filtering is fine for V1)

**Data fetching:**
- On mount: `GET /api/drafts` (no filters) → all user's drafts
- Apply filters client-side (filter array by platform/status/bucket/search)
- For V2: add query params to API route for server-side filtering

**Acceptance criteria:**
- [ ] Draft list page shows all user's drafts
- [ ] Draft cards show title, platform badge, status badge, preview, timestamp
- [ ] Filters work (platform, status, bucket, search)
- [ ] Empty state shows helpful prompt
- [ ] Click card → navigate to `/drafts/[id]`
- [ ] Responsive (3-col desktop, 1-col mobile)

---

### `/drafts/[id]` — Draft Detail Page

**Layout:**
- Back button (← Back to Drafts)
- Draft header:
  - Editable title (click to edit → PATCH /api/drafts/[id])
  - Platform badge
  - Status dropdown (from StatusBadge component)
  - "Copy to clipboard" button
  - "Delete draft" button (confirmation dialog)
- Main content area:
  - Toggle: "View" | "Edit" mode
  - View mode: Rendered markdown (same as DraftPanel from Task 10)
  - Edit mode: Textarea with markdown content (DraftEditor component)
  - "Save" button (only in Edit mode) → PATCH /api/drafts/[id] with content
- Sidebar:
  - Version history (VersionList component from Task 10)
  - Metadata: created_at, updated_at, version number
  - Link to originating conversation (if conversation_id exists)

**DraftEditor component:**
- Controlled textarea with markdown content
- Auto-resize to fit content
- Character count (optional)
- "Save" and "Cancel" buttons
- On save: PATCH /api/drafts/[id] with `{ content }` → increments version

**Data fetching:**
- On mount: `GET /api/drafts/[id]` → returns `{ draft: Draft, versions: DraftVersion[] }`
- Use Next.js 16 async params: `{ params }: { params: Promise<{ id: string }> }` with `await params`

**Integration with Task 10 components:**
- Reuse `StatusBadge` from Task 10 (already built)
- Reuse `VersionList` from Task 10 (already built)
- Pattern: Task 10 built these for in-conversation use, Task 11 reuses them here

**Acceptance criteria:**
- [ ] Draft detail page shows full draft content
- [ ] Title is editable (click to edit)
- [ ] Status can be changed via dropdown
- [ ] Toggle between View and Edit mode
- [ ] Edit mode shows textarea, Save/Cancel buttons
- [ ] Save increments version (v1 → v2)
- [ ] Copy to clipboard works
- [ ] Delete draft works (with confirmation)
- [ ] Version history sidebar shows all versions
- [ ] Click version → view that version's content (read-only)
- [ ] Link to conversation works (if conversation_id exists)
- [ ] Back button returns to /drafts list

---

## Design Patterns to Follow

**Reference existing pages:**
- `/buckets` (list page pattern) — grid layout, filter bar, cards
- `/buckets/[id]` (detail page pattern) — header with actions, main content, sidebar
- `/conversations/[id]` (split pane, content display) — markdown rendering

**Reuse components from Task 10:**
- `StatusBadge` — status dropdown
- `VersionList` — version history sidebar

**Follow Specter design system:**
- Ghost Cyan (`--primary`) for primary actions
- True Black (`--bg`) background
- Clash Display for headings
- Manrope for body text
- shadcn/ui components: Button, Dialog, Select, Textarea, Badge

---

## Acceptance Criteria

**Draft list page (`/drafts`):**
- [ ] Shows all user's drafts in grid layout
- [ ] Draft cards show title, platform, status, preview, timestamp
- [ ] Filters work (platform, status, bucket, search)
- [ ] Click card navigates to detail page
- [ ] Empty state when no drafts
- [ ] Responsive layout

**Draft detail page (`/drafts/[id]`):**
- [ ] Shows full draft content (rendered markdown in View mode)
- [ ] Title editable (click to edit, PATCH on blur)
- [ ] Status changeable via dropdown
- [ ] View/Edit toggle works
- [ ] Edit mode shows textarea + Save/Cancel
- [ ] Save creates new version, preserves old versions
- [ ] Copy to clipboard works
- [ ] Delete draft works with confirmation
- [ ] Version history sidebar (reuse VersionList from Task 10)
- [ ] Link to originating conversation
- [ ] Back button to /drafts list

**Infrastructure:**
- [ ] No TypeScript errors
- [ ] Follows Specter design system
- [ ] Uses shadcn/ui components
- [ ] Async params pattern on [id] route
- [ ] Reuses Task 10 components (StatusBadge, VersionList)

---

## Reference Files

| File | What to look for |
|------|-----------------|
| `builder-agent-guide.md` | Builder autonomy vs contracts |
| `claude-code-agent-instructions.md` | Coding conventions, Specter design tokens |
| `lib/types.ts` | `Draft`, `DraftVersion`, `DraftStatus`, `PLATFORM_CONFIG` |
| `app/api/drafts/route.ts` | Task 10's GET /api/drafts (list endpoint) |
| `app/api/drafts/[id]/route.ts` | Task 10's GET/PATCH/DELETE endpoints |
| `components/drafts/StatusBadge.tsx` | Task 10's status dropdown component (reuse) |
| `components/drafts/VersionList.tsx` | Task 10's version history component (reuse) |
| `app/buckets/page.tsx` | Pattern for list page with grid layout |
| `app/buckets/[id]/page.tsx` | Pattern for detail page with sidebar |
| `components/conversations/MessageBubble.tsx` | Markdown rendering pattern |

---

## Notes for Builder

- **This is a pattern-following task.** Look at `/buckets` and `/buckets/[id]` for layout patterns.
- **Reuse Task 10 components** — StatusBadge and VersionList already exist, import and use them.
- **Client-side filtering is fine for V1** — fetch all drafts, filter in browser. Server-side filtering is a V2 enhancement.
- **Markdown editor can be simple** — a styled textarea is sufficient. No need for a rich WYSIWYG editor.
- **Follow the brief-writing principles** — tight interfaces (API contracts, component props), loose internals (you choose implementation details).
