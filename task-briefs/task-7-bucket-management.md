# Task 7 — Bucket Management

**Status:** NOT STARTED
**Dependencies:** Task 6 (Source Capture — COMPLETE), Task 4.5 (shadcn/ui — COMPLETE)
**Agent type:** Builder (Sonnet)
**Estimated effort:** 1 agent session

---

## Objective

Build bucket CRUD, the bucket list view, and the bucket detail view. Buckets are thematic clusters that organize sources and anchor conversations. Users create buckets for themes like "AI Developments", "Thought Leadership", or "Business AI Outcomes", then sort inbox sources into them. This is the organizational backbone — conversations (Task 9) and the dashboard (Task 12) depend on buckets existing.

This is a **coding task.** You are building the bucket list page, bucket detail page, CRUD API routes, and a create-bucket modal.

---

## Before You Start

Read these files in order:

1. `claude-code-agent-instructions.md` — Coding conventions, component patterns
2. `app/globals.css` — Design tokens (shadcn naming: `bg-primary` = Ghost Cyan, `bg-card` = Charcoal, etc.)
3. `lib/types.ts` — `Bucket`, `CreateBucketInput`, `Source`, `SourceType`, `BUCKET_COLORS` types/constants
4. `lib/supabase/server.ts` — Server-side Supabase client
5. `lib/supabase/client.ts` — Client-side Supabase client
6. `app/buckets/page.tsx` — Existing stub (placeholder text)
7. `app/buckets/[id]/page.tsx` — Existing stub (placeholder text)
8. `app/api/buckets/route.ts` — Existing stub (returns empty array)
9. `components/inbox/SourceCard.tsx` — Existing source card component (REUSE in bucket detail)
10. `components/inbox/InboxView.tsx` — Reference for how source lists work (fetch pattern, state management)
11. `components/ui/button.tsx` — shadcn Button pattern

---

## What's Already Done (Tasks 0–6)

- ✅ Next.js 14 with App Router, TypeScript, Tailwind v4
- ✅ Supabase live — `buckets` table (id, name, description, color, owner_id, sort_order), `sources` table with `bucket_id` FK
- ✅ Authentication flow (middleware protects all routes)
- ✅ Layout shell — Buckets page routed at `/buckets`, bucket detail at `/buckets/[id]`
- ✅ shadcn/ui configured — Button, Badge, Dialog, DropdownMenu, Textarea, Select, Label already installed
- ✅ **Source CRUD fully working** — `GET/POST/PATCH/DELETE /api/sources`, auto-embedding
- ✅ **SourceCard component** — Shows source content, type badge, timestamp, edit/move/delete actions. Accepts `buckets` prop for the "Move to bucket" dropdown.
- ✅ **InboxView** — Already fetches from `GET /api/buckets` (currently returns `[]` from the stub)
- ✅ **CaptureModal** — Already fetches buckets for the destination picker
- ✅ `BUCKET_COLORS` palette defined in `lib/types.ts`
- ✅ `relativeTime()` utility in `lib/format.ts`

You're replacing the bucket stubs with full implementations. Once the bucket API works, the existing InboxView "Move to bucket" and CaptureModal "Destination" features will automatically start working.

---

## Context: How Buckets Are Used

**Thematic areas Abhay and Srikar organize around:**
- AI Developments — what's new, what's happening
- AI Applications — how AI is being used in practice
- AI Futures — where it's headed, how it changes over time
- Thought Leadership — personal takes, perspectives
- Business AI Outcomes — helping business leaders think about AI for their companies

**Workflow:** Sources land in the inbox first, then get triaged into buckets. Some sources go directly into a bucket at capture time. Once organized, users start conversations within a bucket to brainstorm angles and draft content.

**Visibility:** Both users can see all buckets. Buckets have an owner but are workspace-wide.

---

## Step-by-Step Instructions

### Step 1: Install additional shadcn components (if needed)

```bash
npx shadcn@latest add alert-dialog popover input
```

- `alert-dialog` — For delete confirmation
- `popover` — For the color picker
- `input` — For bucket name/description inputs (may already be installed from Task 5 — check first)

If any of these already exist in `components/ui/`, skip them.

### Step 2: Implement bucket CRUD API routes

#### 2a: `app/api/buckets/route.ts` (replace stub)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all buckets (workspace-wide visibility) with source and draft counts
  const { data: buckets, error } = await supabase
    .from('buckets')
    .select(`
      *,
      sources(count),
      drafts(count)
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten counts from Supabase's nested aggregation
  const formatted = (buckets ?? []).map((b: any) => ({
    ...b,
    source_count: b.sources?.[0]?.count ?? 0,
    draft_count: b.drafts?.[0]?.count ?? 0,
    sources: undefined,
    drafts: undefined,
  }))

  return NextResponse.json({ buckets: formatted })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, color } = await request.json()

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 })
  }

  // Auto-assign color from palette if not provided
  const { data: existing } = await supabase
    .from('buckets')
    .select('color')

  const usedColors = (existing ?? []).map((b: any) => b.color)
  const BUCKET_COLORS = [
    '#E8B931', '#4A9EDE', '#D4594E', '#9B59B6',
    '#2ECC71', '#E67E22', '#1ABC9C', '#E74C3C',
    '#3498DB', '#F39C12',
  ]
  const availableColor = BUCKET_COLORS.find((c) => !usedColors.includes(c)) || BUCKET_COLORS[0]

  // Determine next sort_order
  const { data: maxSort } = await supabase
    .from('buckets')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = ((maxSort?.[0]?.sort_order ?? -1) + 1)

  const { data, error } = await supabase
    .from('buckets')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      color: color || availableColor,
      owner_id: user.id,
      sort_order: nextSort,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bucket: data }, { status: 201 })
}
```

**Key details:**
- GET returns all buckets (both users see all — workspace-wide visibility)
- Source and draft counts are aggregated via Supabase's nested select
- Color auto-assignment from the `BUCKET_COLORS` palette, picking the first unused color
- Sort order auto-increments

#### 2b: Create `app/api/buckets/[id]/route.ts` (NEW FILE)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch the bucket
  const { data: bucket, error } = await supabase
    .from('buckets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  // Fetch sources in this bucket
  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('bucket_id', id)
    .order('created_at', { ascending: false })

  // Fetch drafts in this bucket
  const { data: drafts } = await supabase
    .from('drafts')
    .select('*')
    .eq('bucket_id', id)
    .order('created_at', { ascending: false })

  // Fetch conversations for this bucket
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('bucket_id', id)
    .order('updated_at', { ascending: false })

  return NextResponse.json({
    bucket,
    sources: sources ?? [],
    drafts: drafts ?? [],
    conversations: conversations ?? [],
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, any> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.color !== undefined) updates.color = body.color
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('buckets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bucket: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Note: sources with this bucket_id will have bucket_id set to NULL (ON DELETE SET NULL)
  // This moves them back to the inbox, which is the correct behavior.
  const { error } = await supabase
    .from('buckets')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
```

**Key detail:** Deleting a bucket sets `bucket_id = NULL` on all its sources (ON DELETE SET NULL in the schema), effectively moving them back to inbox. This is correct and should be communicated in the UI.

### Step 3: Build the Create Bucket modal

Create `components/buckets/CreateBucketModal.tsx` — a Dialog for creating a new bucket.

**Fields:**
- **Name** (required) — text input, placeholder: "e.g., AI Developments"
- **Description** (optional) — textarea, placeholder: "What kind of content goes here?"
- **Color** — a small color picker showing the 10 `BUCKET_COLORS`. Render as a row of colored circles, click to select. Auto-selects the next unused color by default.

**Behavior:**
- Opens from a "New Bucket" button on the buckets list page
- On submit: POST to `/api/buckets`, close modal, refresh bucket list
- Show brief loading state on the submit button

**Styling:**
- Dialog: `bg-popover` background
- Primary action button: Ghost Cyan (`bg-primary`)
- Color circles: `w-6 h-6 rounded-full cursor-pointer`, selected one gets a `ring-2 ring-primary ring-offset-2 ring-offset-popover`

### Step 4: Build the Bucket List page

Replace the stub `app/buckets/page.tsx`.

**Architecture:** Server component wrapper + client component `components/buckets/BucketListView.tsx`.

**BucketListView features:**
- Fetches all buckets on mount: `GET /api/buckets`
- Displays buckets as cards in a responsive grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`)
- Each bucket card shows:
  - Color indicator — a small colored circle or left border stripe using the bucket's color
  - Bucket name (prominent, `text-foreground font-medium`)
  - Description (if present, `text-muted-foreground text-sm`, truncated to 2 lines)
  - Source count: "12 sources"
  - Draft count: "3 drafts"
  - Relative timestamp of last update
  - Click anywhere → navigates to `/buckets/[id]`

**Header:**
- "Buckets" title + "New Bucket" button (opens CreateBucketModal)
- Max width: none needed — grid layout handles it

**Empty state:**
- When no buckets exist:
  - "No buckets yet"
  - "Create your first bucket to start organizing sources"
  - "New Bucket" button (Ghost Cyan)

**Styling:**
- Cards: `bg-card border border-border rounded-lg p-5 hover:border-border-light transition-colors cursor-pointer`
- Color indicator: either a `w-3 h-3 rounded-full` circle in the header, or a `w-1 rounded-full` left stripe
- Counts: `text-xs text-muted-foreground`

### Step 5: Build the Bucket Detail page

Replace the stub `app/buckets/[id]/page.tsx`.

**Architecture:** Server component that fetches bucket data, renders client component `components/buckets/BucketDetailView.tsx`.

**BucketDetailView features:**

**Header section:**
- Back link: "← Buckets" (navigates to `/buckets`)
- Bucket name (h1, editable on click — inline rename)
- Bucket color circle (clickable to change — small popover with BUCKET_COLORS palette)
- Description (editable on click, or "Add description" placeholder)
- "Start Conversation" button — creates a conversation record tied to this bucket, navigates to `/conversations/[id]`. This button is for Task 9's UI, but we create the conversation record now:
  ```typescript
  // POST to create conversation
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: bucket.id }),
  })
  const { conversation } = await res.json()
  router.push(`/conversations/${conversation.id}`)
  ```
  **Note:** The `/api/conversations` route is a stub that returns 501. The builder should implement a MINIMAL version: just create the conversation row and return it. The full conversation UI is Task 9 — we just need the record created and the navigation to work.
- "Delete Bucket" button (destructive, with AlertDialog confirmation). Warning text: "This will move all X sources back to your inbox."

**Source list section:**
- Title: "Sources (X)" where X is the count
- Reuse the existing `SourceCard` component from `components/inbox/SourceCard.tsx`
- The SourceCard already supports edit, move-to-bucket, and delete
- For the "Move" dropdown in SourceCard, pass all OTHER buckets (not the current one) plus an "Inbox" option
- To handle "Move to Inbox", PATCH the source with `bucketId: null`

**Drafts section (below sources):**
- Title: "Drafts (X)"
- If drafts exist: show them as simple preview cards (title, platform badge, status badge, timestamp)
- If no drafts: "No drafts yet. Start a conversation to begin drafting."
- Drafts are read-only here — clicking navigates to `/drafts/[id]` (stub page, built in Task 11)

**Conversations section:**
- Title: "Conversations (X)"
- If conversations exist: list them (title or "Untitled", timestamp, mode badge)
- If none: "No conversations yet."
- Each links to `/conversations/[id]`

**Empty source state (bucket has no sources):**
- "No sources in this bucket yet"
- "Move sources from your inbox, or capture directly into this bucket"
- "Go to Inbox" link + "Capture" button (opens CaptureModal)

### Step 6: Implement minimal conversation creation

Update `app/api/conversations/route.ts` to support POST (create) alongside the existing stub.

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Keep returning 501 for now — full implementation in Task 9
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bucketId } = await request.json()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      bucket_id: bucketId || null,
      owner_id: user.id,
      mode: 'explore',
      include_all_buckets: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversation: data }, { status: 201 })
}
```

This is minimal — just creates the row so "Start Conversation" works. Full conversation functionality comes in Tasks 8-9.

### Step 7: Test everything

```bash
pnpm dev
```

Verify:

**Bucket List (`/buckets`):**
1. Empty state renders when no buckets exist
2. "New Bucket" opens the create modal
3. Can create a bucket with name, description, color
4. Color auto-assigns if not picked
5. Bucket cards show name, description, source count (0), draft count (0)
6. Click a bucket card → navigates to `/buckets/[id]`

**Bucket Detail (`/buckets/[id]`):**
7. Shows bucket name, color, description
8. Can rename bucket inline
9. Can change bucket color
10. Can edit description
11. Source list shows sources in this bucket (may be empty initially)
12. "Start Conversation" creates a conversation and navigates
13. "Delete Bucket" shows confirmation dialog, warns about sources moving to inbox
14. After deleting, sources return to inbox (verify in `/inbox`)

**Integration with existing features:**
15. Go to `/inbox` → "Move" dropdown on source cards now lists real buckets
16. Move a source to a bucket → source disappears from inbox, appears in bucket detail
17. Open Capture modal (Cmd+K) → destination dropdown now lists real buckets
18. Capture a source directly into a bucket → appears in bucket detail, not inbox

**Technical:**
19. `pnpm tsc --noEmit` — zero TypeScript errors
20. No console errors
21. Responsive: bucket grid stacks on mobile

### Step 8: Commit

```bash
git add -A
git commit -m "Task 7: Bucket management — CRUD, list view, detail view, conversation creation"
```

---

## Output

A complete bucket management system:
- Bucket CRUD API routes (GET list, POST create, GET detail, PATCH update, DELETE)
- Bucket list page with responsive card grid and create modal
- Bucket detail page with inline editing, source list (reusing SourceCard), draft/conversation lists
- Color auto-assignment from palette
- "Start Conversation" button (creates conversation record)
- Delete with AlertDialog confirmation (sources move to inbox)
- Minimal conversation POST route (creates row for Task 9)
- Existing features (InboxView "Move", CaptureModal "Destination") automatically work

---

## Acceptance Criteria

- [ ] `GET /api/buckets` returns all buckets with source_count and draft_count
- [ ] `POST /api/buckets` creates bucket with name, description, auto-assigned color
- [ ] `GET /api/buckets/[id]` returns bucket with its sources, drafts, conversations
- [ ] `PATCH /api/buckets/[id]` updates name, description, color, sort_order
- [ ] `DELETE /api/buckets/[id]` deletes bucket (sources move to inbox via ON DELETE SET NULL)
- [ ] `POST /api/conversations` creates a conversation tied to a bucket (minimal, for "Start Conversation")
- [ ] Bucket list page shows responsive grid of bucket cards
- [ ] Bucket cards show color indicator, name, description, source/draft counts
- [ ] Bucket cards link to `/buckets/[id]`
- [ ] "New Bucket" button opens create modal with name, description, color picker
- [ ] Color auto-assigns from `BUCKET_COLORS` palette (first unused color)
- [ ] Empty state renders when no buckets exist
- [ ] Bucket detail page shows bucket info with inline editing (name, description, color)
- [ ] Bucket detail lists sources using existing SourceCard component
- [ ] SourceCard "Move" dropdown shows other buckets + "Inbox" option
- [ ] Moving a source to inbox sets bucket_id to null
- [ ] Bucket detail lists drafts (preview cards with platform/status badges)
- [ ] Bucket detail lists conversations (title, timestamp, mode)
- [ ] "Start Conversation" button creates conversation and navigates to `/conversations/[id]`
- [ ] "Delete Bucket" shows AlertDialog with warning about sources returning to inbox
- [ ] After bucket delete, orphaned sources appear in inbox
- [ ] InboxView "Move to bucket" dropdown now shows real buckets
- [ ] CaptureModal "Destination" dropdown now shows real buckets
- [ ] Capturing directly into a bucket works
- [ ] Page styled with Specter design system (bg-card, Ghost Cyan accents, proper typography)
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] No console errors
- [ ] Responsive: grid stacks on mobile
- [ ] Git committed with proper message

---

## Reference Files

| File | What to look at |
|------|----------------|
| `lib/types.ts` | `Bucket`, `CreateBucketInput`, `BUCKET_COLORS`, `Source`, `SourceType` |
| `lib/format.ts` | `relativeTime()` — reuse for timestamps |
| `components/inbox/SourceCard.tsx` | **REUSE THIS** for source display in bucket detail |
| `components/inbox/InboxView.tsx` | Reference for fetch pattern, state management |
| `components/capture/CaptureModal.tsx` | Already fetches buckets — will auto-work once API returns real data |
| `lib/supabase/server.ts` | Server client pattern for API routes |
| `app/globals.css` | Design tokens |
| `components/ui/button.tsx` | shadcn Button |
| `claude-code-agent-instructions.md` | Coding conventions |
| `technical-architecture-and-database-schema.md` | Schema for buckets, sources, conversations, drafts |
| `product-requirements-document.md` | Bucket Management section (section 3) |

---

## Notes for the Agent

- **REUSE SourceCard:** Do NOT rebuild source display. Import `SourceCard` from `components/inbox/SourceCard.tsx`. It already handles edit, move, and delete. Pass the appropriate `buckets` prop (other buckets, not the current one).
- **Workspace-wide visibility:** Both users see all buckets. The GET route does NOT filter by owner_id — it returns all buckets. Only edits/deletes need ownership in practice, but RLS handles this.
- **Supabase count aggregation:** Use `select('*, sources(count), drafts(count)')` — Supabase returns `{ sources: [{ count: N }], drafts: [{ count: N }] }`. Flatten these in the API response.
- **ON DELETE SET NULL:** The database schema uses `ON DELETE SET NULL` for `sources.bucket_id`. When a bucket is deleted, sources automatically get `bucket_id = null` (back to inbox). The API route doesn't need to manually move them.
- **Color picker:** Keep it simple — a row of 10 colored circles from `BUCKET_COLORS`. Not a full color spectrum picker.
- **Inline editing:** For the bucket name in the detail view, a simple click-to-edit pattern: show text normally, click turns it into an input, blur or Enter saves via PATCH.
- **"Start Conversation" creates a record:** The conversation POST route is minimal — just inserts a row with `bucket_id`, `owner_id`, `mode: 'explore'`, `include_all_buckets: true`. The full conversation UI is Task 9.
- **shadcn components:** `alert-dialog` (delete confirm), `popover` (color picker), `input` (bucket name). Check if any are already installed before running `npx shadcn@latest add`.
- **`params` in Next.js 14:** Route params are a Promise. Use `const { id } = await params`.
- **Token naming:** Ghost Cyan = `bg-primary` / `text-primary`. Cards = `bg-card`. Muted text = `text-muted-foreground`. Hover gray = `bg-accent`.
- **Component organization:** Put bucket components in `components/buckets/`. Keep files under ~150 lines.
- **Don't over-engineer:** No drag-and-drop reordering, no nested buckets, no search within bucket. Simple CRUD with a clean UI.
