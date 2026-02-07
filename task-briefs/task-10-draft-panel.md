# Task 10 — Draft Panel (Save, Versions, Status, CRUD)

**Status:** READY
**Dependencies:** Task 9 (Conversation UI) — needs DraftPreview component to enhance
**Agent type:** Builder

---

## Objective

Upgrade the minimal DraftPreview from Task 9 into a full draft panel with "Save to Drafts" promotion, version history, status management, and editable titles. Also build the draft CRUD API routes (currently 501 stubs).

After this task, users can: write a draft in conversation → save it → browse versions → mark it ready/published.

---

## Architecture Context

```
Conversation view (Draft mode) — Task 9 shows extracted draft in DraftPreview
    ↓
User clicks "Save to Drafts"
    ↓
POST /api/drafts — creates row in drafts table + draft_versions row
    ↓
DraftPanel replaces DraftPreview — shows saved draft with:
    - Editable title
    - Status badge (draft → ready → published)
    - Version history (v1, v2, v3...)
    - Copy to clipboard
    ↓
User requests revision in chat → Sonnet produces new draft
    ↓
"Update Draft" → PATCH /api/drafts/[id] — updates content, increments version, saves to draft_versions
```

**Key concept:** Drafts table rows are created by explicit user action ("Save to Drafts"), not automatically. Before saving, the draft lives only as `message.draft_content` on the assistant message. This keeps the drafts list clean — only intentionally saved drafts appear.

---

## Database Schema (already exists)

```sql
-- drafts table
drafts: id, conversation_id, bucket_id, owner_id, title, platform, status, content, version, created_at, updated_at

-- draft_versions table (append-only history)
draft_versions: id, draft_id, version, content, created_at
```

**Types (from `lib/types.ts`):**
- `Draft` — full draft entity
- `DraftVersion` — version history row
- `DraftStatus = 'draft' | 'ready' | 'published'`

---

## Files to Create/Modify

### API Routes

| File | Action |
|------|--------|
| `app/api/drafts/route.ts` | Replace 501 stub — GET (list) + POST (create) |
| `app/api/drafts/[id]/route.ts` | NEW — GET (detail + versions) + PATCH (update) + DELETE |

### Components

| File | Action |
|------|--------|
| `components/conversations/DraftPreview.tsx` | MODIFY (Task 9 creates this) — add "Save to Drafts" / "Update Draft" button |
| `components/drafts/DraftPanel.tsx` | NEW — full panel: title, status, versions, copy, content display |
| `components/drafts/VersionList.tsx` | NEW — version history sidebar/list within panel |
| `components/drafts/StatusBadge.tsx` | NEW — status badge with dropdown to change status |

---

## API Route Contracts

### GET /api/drafts

List user's drafts with optional filters.

- Query params: `?conversationId=X`, `?platform=linkedin`, `?status=draft`
- Returns: `{ drafts: Draft[] }` ordered by `updated_at` desc
- Auth: owner_id = user.id

### POST /api/drafts

Create a new draft (the "Save to Drafts" action).

- Body: `{ title, platform, content, conversationId?, bucketId? }`
- Creates draft row (version=1, status='draft')
- Also creates draft_versions row (version=1, same content)
- Returns: `{ draft: Draft }` with status 201

### GET /api/drafts/[id]

Fetch draft with version history.

- Returns: `{ draft: Draft, versions: DraftVersion[] }` — versions ordered by version desc
- Auth: owner_id = user.id

### PATCH /api/drafts/[id]

Update a draft. Two use cases:
1. **Content update** (user revises draft) — increment version, save to draft_versions
2. **Metadata update** (title, status) — no version increment

- Body: `{ title?, content?, status?, platform? }`
- If `content` is provided: increment `draft.version`, insert new `draft_versions` row, update `draft.content`
- If only metadata (title/status/platform): update without version increment
- Returns: `{ draft: Draft }`

### DELETE /api/drafts/[id]

Delete a draft and all its versions (cascade).

- Returns: 204 no content
- Auth: owner_id = user.id

**All routes use async params pattern:** `{ params }: { params: Promise<{ id: string }> }` with `await params`.

---

## Component Contracts

### DraftPreview Enhancement (modify Task 9's component)

Add a button that appears when there's an extracted draft:

- **No saved draft exists for this conversation:** Show "Save to Drafts" button → POST /api/drafts
- **Saved draft exists:** Show "Update Draft" button → PATCH /api/drafts/[id] with new content
- After saving/updating: transition to showing the full DraftPanel

To determine if a saved draft exists: fetch `GET /api/drafts?conversationId=X` on mount. If a draft exists for this conversation + platform, show "Update" instead of "Save".

### DraftPanel

Replaces DraftPreview after the user saves a draft. Shows:

- **Title** — editable (click to edit → PATCH)
- **Platform badge** — from PLATFORM_CONFIG
- **Status badge** — with dropdown to change (draft → ready → published) → PATCH
- **Content** — rendered markdown
- **Copy to clipboard** button
- **Version list** — collapsible sidebar or dropdown showing v1, v2, v3... Click to view that version's content.
- **"Back to chat" or close** — return to DraftPreview mode (still in conversation)

### VersionList

- Shows version numbers with timestamps
- Current version highlighted
- Click to view a previous version (read-only display)
- Latest version is always the active/editable one

### StatusBadge

- Visual badge: draft (gray), ready (cyan/primary), published (green)
- Dropdown to change status → PATCH /api/drafts/[id]

---

## "Save to Drafts" Flow (Step by Step)

1. User is in Draft mode conversation
2. Sonnet produces a response with `<draft platform="linkedin" title="AI ROI">content...</draft>`
3. 8c extracts draft, saves `draft_content` on assistant message, sends `done` event with `{ draft: ExtractedDraft }`
4. Task 9's DraftPreview shows the extracted draft
5. **Task 10 adds:** "Save to Drafts" button below the preview
6. User clicks "Save to Drafts":
   - POST /api/drafts with `{ title: draft.title, platform: draft.platform, content: draft.content, conversationId, bucketId }`
   - Draft row created (version 1)
   - DraftPreview transitions to DraftPanel view
7. User requests revision: "Make it punchier"
8. Sonnet produces updated draft → new `done` event with new ExtractedDraft
9. DraftPreview shows new draft + "Update Draft" button (detects existing saved draft)
10. User clicks "Update Draft":
    - PATCH /api/drafts/[id] with `{ content: newDraft.content }`
    - Version incremented (v1 → v2), old content preserved in draft_versions
    - DraftPanel shows v2, version list shows v1 and v2

---

## What This Task Does NOT Do

- **NOT the conversation UI** — that's Task 9. This enhances the right pane only.
- **NOT the `/drafts` list page** — that's Task 11 (Draft Management Page).
- **NOT draft editing in a text editor** — content comes from Claude. Users request revisions via chat.
- **NOT multi-platform variants in one panel** — each platform variant is a separate draft row. The conversation can have multiple drafts (one per platform). V2 enhancement.

---

## Acceptance Criteria

**API routes:**
- [ ] GET /api/drafts returns user's drafts with optional filters (conversationId, platform, status)
- [ ] POST /api/drafts creates draft + initial draft_version row
- [ ] GET /api/drafts/[id] returns draft + all versions
- [ ] PATCH /api/drafts/[id] with content: increments version, creates draft_versions row
- [ ] PATCH /api/drafts/[id] with metadata only (title/status): no version increment
- [ ] DELETE /api/drafts/[id] deletes draft + cascades versions
- [ ] All routes auth-checked, ownership-verified
- [ ] Async params pattern on [id] routes

**Draft panel UI:**
- [ ] "Save to Drafts" button appears in DraftPreview when draft is extracted but not yet saved
- [ ] "Update Draft" button appears when saved draft exists and new draft is extracted
- [ ] DraftPanel shows: editable title, platform badge, status badge, rendered content, copy button
- [ ] Version list shows all versions with timestamps
- [ ] Click version to view its content (read-only)
- [ ] Status can be changed via dropdown (draft → ready → published)
- [ ] Copy to clipboard works
- [ ] Title editable via click-to-edit

**Infrastructure:**
- [ ] No TypeScript errors, no lint errors
- [ ] Follows existing patterns: shadcn/ui components, Specter design tokens
- [ ] Uses existing types: Draft, DraftVersion, DraftStatus from lib/types.ts

---

## Reference Files

| File | What to look for |
|------|-----------------|
| `builder-agent-guide.md` | Builder autonomy vs contracts |
| `claude-code-agent-instructions.md` | Coding conventions |
| `lib/types.ts` | `Draft`, `DraftVersion`, `DraftStatus`, `PLATFORM_CONFIG` |
| `technical-architecture-and-database-schema.md` lines 166-191 | drafts + draft_versions table schemas |
| `components/conversations/DraftPreview.tsx` | Task 9's component — modify to add save/update buttons |
| `components/buckets/BucketDetailView.tsx` | Pattern for CRUD + inline editing |
| `app/api/sources/[id]/route.ts` | Pattern for GET/PATCH/DELETE with async params |
