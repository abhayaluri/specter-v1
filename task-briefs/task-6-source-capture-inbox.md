# Task 6 — Source Capture & Inbox

**Status:** NOT STARTED
**Dependencies:** Task 4.5 (shadcn/ui — COMPLETE), Task 2.5 (embedding pipeline — COMPLETE)
**Agent type:** Builder (Sonnet)
**Estimated effort:** 1 agent session

---

## Objective

Build the source capture modal and inbox view. Users capture ideas, links, notes, and clips from multiple sources into an inbox (or directly into buckets). Every new source automatically gets embedded for semantic search. This is the content ingestion backbone — everything downstream (buckets, Explore mode, Draft mode) depends on having rich source material.

This is a **coding task.** You are building a capture modal, inbox page, CRUD API routes, and wiring up auto-embedding.

---

## Before You Start

Read these files in order:

1. `claude-code-agent-instructions.md` — Coding conventions, component patterns
2. `app/globals.css` — Design tokens (shadcn naming: `bg-primary` = Ghost Cyan, `bg-card` = Charcoal, etc.)
3. `lib/types.ts` — `Source`, `SourceType`, `CreateSourceInput` types
4. `lib/supabase/server.ts` — Server-side Supabase client
5. `lib/supabase/client.ts` — Client-side Supabase client
6. `lib/embeddings.ts` — `embedText`, `truncateForEmbedding` functions
7. `app/api/embed/route.ts` — Existing embedding API route (fully implemented)
8. `app/api/sources/route.ts` — Existing stub (501 not implemented)
9. `app/inbox/page.tsx` — Existing stub (placeholder text)
10. `components/ui/button.tsx` — shadcn Button pattern reference

---

## What's Already Done (Tasks 0–4.5)

- ✅ Next.js 14 with App Router, TypeScript, Tailwind v4
- ✅ Supabase live — `sources` table with `embedding vector(1536)`, `bucket_id`, `source_type`, `content`, `source_url`, `metadata`
- ✅ OpenAI embedding pipeline (`lib/embeddings.ts`) — `embedText()`, `truncateForEmbedding()`, tested
- ✅ Embedding API route (`/api/embed`) — accepts `{ sourceId }` or `{ sourceIds }`, generates and stores embeddings
- ✅ Authentication flow (middleware protects all routes)
- ✅ Layout shell (AppShell, Sidebar, TopBar) — Inbox page routed at `/inbox`
- ✅ shadcn/ui configured — Button component, `cn()` utility
- ✅ Stub files exist for sources API route and inbox page

You're replacing the stubs with full implementations and adding the capture modal.

---

## Context: How Users Capture Content

**Primary user:** Abhay (and Srikar), building content for Compound.

**What they capture (all types, ranked by frequency):**
1. **Twitter/X content** (most frequent — 3-5x/week) — Tweets, threads, quotes to riff on
2. **Original thoughts & notes** — Raw ideas, observations, frameworks typed out
3. **Article highlights & links** — Blog posts, newsletters, research clipped or bookmarked
4. **Meeting notes & voice memos** — Notes from calls, internal meetings

**Source types (from `SourceType` in `lib/types.ts`):**
`'note' | 'link' | 'voice_memo' | 'podcast_note' | 'article_clip' | 'tweet'`

**Core workflow:** Capture fast → sort later. Most sources land in the **inbox** (no bucket) first, then get organized into buckets during review sessions. Some sources go directly into a bucket if the user knows where it belongs.

**Thematic buckets they'll create (Task 7 — for context):**
- AI Developments, AI Applications, AI Futures, Thought Leadership, Business AI Outcomes

---

## Step-by-Step Instructions

### Step 1: Install shadcn components

```bash
npx shadcn@latest add dialog dropdown-menu badge textarea select label
```

These provide the Dialog (modal), DropdownMenu (actions), Badge (type indicators), and form inputs for the capture modal.

### Step 2: Implement source CRUD API routes

#### 2a: `app/api/sources/route.ts` (replace stub)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const bucketId = searchParams.get('bucketId')
  const inbox = searchParams.get('inbox')

  let query = supabase
    .from('sources')
    .select('*, buckets(name)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (inbox === 'true') {
    query = query.is('bucket_id', null)
  } else if (bucketId) {
    query = query.eq('bucket_id', bucketId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten joined bucket name
  const sources = (data ?? []).map((s: any) => ({
    ...s,
    bucket_name: s.buckets?.name ?? null,
    buckets: undefined,
  }))

  return NextResponse.json({ sources })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Support bulk creation (array of sources)
  const items = Array.isArray(body) ? body : [body]

  const sourcesToInsert = items.map((item: any) => ({
    content: item.content,
    source_type: item.sourceType || 'note',
    source_url: item.sourceUrl || null,
    bucket_id: item.bucketId || null,
    owner_id: user.id,
    metadata: item.metadata || {},
  }))

  const { data, error } = await supabase
    .from('sources')
    .insert(sourcesToInsert)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget: trigger embedding generation for all new sources
  const sourceIds = (data ?? []).map((s: any) => s.id)
  if (sourceIds.length > 0) {
    // Use absolute URL for server-side fetch
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ sourceIds }),
    }).catch((err) => console.error('Embedding generation failed:', err))
  }

  return NextResponse.json(
    { sources: data, count: data?.length ?? 0 },
    { status: 201 }
  )
}
```

**Key detail:** The POST handler triggers `/api/embed` as fire-and-forget after creating sources. The embedding happens asynchronously — the user doesn't wait for it.

#### 2b: Create `app/api/sources/[id]/route.ts` (NEW FILE)

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

  const { data, error } = await supabase
    .from('sources')
    .select('*, buckets(name)')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({
    source: { ...data, bucket_name: data.buckets?.name ?? null, buckets: undefined }
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
  if (body.content !== undefined) updates.content = body.content
  if (body.sourceType !== undefined) updates.source_type = body.sourceType
  if (body.sourceUrl !== undefined) updates.source_url = body.sourceUrl
  if (body.bucketId !== undefined) updates.bucket_id = body.bucketId

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sources')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If content changed, re-embed
  if (updates.content) {
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ sourceId: id }),
    }).catch((err) => console.error('Re-embedding failed:', err))
  }

  return NextResponse.json({ source: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

### Step 3: Build the Capture Modal

Create `components/capture/CaptureModal.tsx` — a global Dialog component.

**Behavior:**
- Opens via "+" button in the sidebar OR `Cmd+K` keyboard shortcut
- Contains a form with:
  - **Content** textarea — the main input (required). Large, prominent, placeholder: "What's on your mind?"
  - **Source URL** input — optional, shown when type is `link`, `tweet`, or `article_clip`
  - **Source Type** select dropdown — defaults to `note`. Options: Note, Link, Tweet, Article Clip, Podcast Note, Voice Memo
  - **Destination** select — "Inbox" (default, bucket_id = null) or a specific bucket (fetched from Supabase)
  - **Submit button** — "Capture" (Ghost Cyan primary button)

**Bulk paste mode:**
- When user pastes multi-line text (more than 2 lines), show a toggle: "Split into individual sources"
- If toggled on, split by double newline (`\n\n`) into separate sources
- Each becomes an individual source with the same type and destination
- POST as an array to `/api/sources`

**Keyboard shortcut:**
- Register `Cmd+K` (Mac) / `Ctrl+K` (Windows) globally
- Use a `useEffect` in the app layout or AppShell to register the handler
- When pressed, opens the CaptureModal

**After capture:**
- Close the modal
- Show brief inline success message ("Captured!" or "X sources captured!")
- If the user is on the inbox page, refresh the list

**Styling:**
- Dialog uses `bg-popover` background (dark surface)
- Ghost Cyan primary button for "Capture"
- `text-muted-foreground` for labels and helper text
- Textarea: `bg-background border-border`, large (`min-h-[120px]`)

### Step 4: Wire the Capture Modal globally

The CaptureModal needs to be accessible from any page. Two approaches (pick the simpler one):

**Option A (recommended):** Add CaptureModal to `components/layout/AppShell.tsx`. Pass an `onOpen` handler to the Sidebar's "+" button. Register `Cmd+K` in AppShell.

```tsx
// In AppShell.tsx, add:
'use client'
import { useState, useEffect } from 'react'
import CaptureModal from '@/components/capture/CaptureModal'

// ... existing code ...

const [captureOpen, setCaptureOpen] = useState(false)

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setCaptureOpen(true)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])

// Render CaptureModal alongside children
```

**Note:** AppShell is currently a server component. You'll need to convert it to a client component (add `'use client'`) or create a wrapper. If converting AppShell is too invasive, create a `CaptureProvider` client component that wraps children and provides the modal + keyboard shortcut.

### Step 5: Build the Inbox page

Replace the stub `app/inbox/page.tsx` with the full inbox view.

**Architecture:** Server component for the page shell, client component `components/inbox/InboxView.tsx` for the interactive list.

**InboxView features:**
- Fetches sources where `bucket_id IS NULL` on mount: `GET /api/sources?inbox=true`
- Displays source cards in a vertical list (newest first)
- Each card shows:
  - Source type badge (color-coded): Note (gray), Link (blue), Tweet (sky), Article Clip (purple), Podcast Note (orange), Voice Memo (green)
  - Content preview (first 2-3 lines, truncated)
  - Source URL (if present, as a subtle link)
  - Relative timestamp ("2 hours ago", "Yesterday")
  - Quick actions row (right side or on hover):
    - **Move to bucket** — dropdown with bucket list, PATCH source with new `bucket_id`
    - **Edit** — opens inline edit mode (expand card, make content editable)
    - **Delete** — with confirmation, DELETE `/api/sources/[id]`

**Empty state:**
- When inbox is empty, show a centered message:
  - Icon (inbox or plus)
  - "Your inbox is empty"
  - "Capture ideas with Cmd+K or the + button"
  - Ghost Cyan "Capture" button that opens the modal

**Source type badge colors:**

```typescript
const SOURCE_TYPE_CONFIG: Record<SourceType, { label: string; color: string }> = {
  note: { label: 'Note', color: 'bg-secondary text-secondary-foreground' },
  link: { label: 'Link', color: 'bg-blue-500/15 text-blue-400' },
  tweet: { label: 'Tweet', color: 'bg-sky-500/15 text-sky-400' },
  article_clip: { label: 'Article', color: 'bg-purple-500/15 text-purple-400' },
  podcast_note: { label: 'Podcast', color: 'bg-orange-500/15 text-orange-400' },
  voice_memo: { label: 'Voice', color: 'bg-emerald-500/15 text-emerald-400' },
}
```

**Layout:**
- Source cards: `bg-card border border-border rounded-lg p-4` with `hover:border-border-light` transition
- List gap: `space-y-3`
- Page header with count: "Inbox (12)" or "Inbox" if empty
- Max width: `max-w-4xl` — content-focused, not full-bleed

### Step 6: Relative time formatting

Create a tiny utility `lib/format.ts`:

```typescript
export function relativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
```

### Step 7: Test everything

```bash
pnpm dev
```

Verify:
1. **Cmd+K** opens the capture modal from any page
2. Can create a **note** source — lands in inbox
3. Can create a **link** source with URL — lands in inbox
4. Can change source type dropdown (all 6 types work)
5. Can choose a destination bucket (if buckets exist — ok if empty for now)
6. **Bulk paste:** paste 3+ paragraphs, toggle "Split into individual sources", creates multiple
7. **Inbox page:** shows all unsorted sources with type badges and timestamps
8. Can **edit** a source inline
9. Can **delete** a source (with confirmation)
10. Can **move** a source to a bucket (dropdown)
11. **Empty state** renders when no sources in inbox
12. Sources appear immediately after capture (optimistic or refetch)
13. No TypeScript errors: `pnpm tsc --noEmit`
14. No console errors
15. Embedding generates in background (check Supabase `sources` table — embedding column should populate within a few seconds)

### Step 8: Commit

```bash
git add -A
git commit -m "Task 6: Source capture & inbox — capture modal, CRUD routes, auto-embedding, inbox view"
```

---

## Output

A complete source capture and inbox system:
- Global capture modal (Cmd+K or "+" button)
- Source CRUD API routes (GET, POST, PATCH, DELETE)
- Bulk paste support (split multi-line input into individual sources)
- Auto-embedding on creation (fire-and-forget to `/api/embed`)
- Re-embedding on content edit
- Inbox page with source cards, type badges, timestamps, quick actions (move/edit/delete)
- Empty state with CTA

---

## Acceptance Criteria

- [ ] `dialog`, `dropdown-menu`, `badge`, `textarea`, `select`, `label` shadcn components installed
- [ ] `GET /api/sources` returns sources filtered by `inbox=true` or `bucketId`
- [ ] `POST /api/sources` creates source(s) and triggers fire-and-forget embedding
- [ ] `POST /api/sources` supports bulk creation (array body)
- [ ] `GET /api/sources/[id]` returns single source
- [ ] `PATCH /api/sources/[id]` updates source fields, re-embeds if content changed
- [ ] `DELETE /api/sources/[id]` deletes source (owner check)
- [ ] Capture modal opens with Cmd+K from any page
- [ ] Capture modal opens from "+" button in sidebar
- [ ] Capture modal has content textarea, source type select, URL input (conditional), destination select
- [ ] Bulk paste: multi-line text triggers "split" toggle, creates individual sources
- [ ] Modal closes after successful capture
- [ ] Inbox page at `/inbox` lists unsorted sources (bucket_id is null)
- [ ] Source cards show type badge, content preview, timestamp, source URL
- [ ] Source type badges are color-coded per type
- [ ] Timestamps show relative time ("2h ago", "3d ago")
- [ ] Can edit source content inline
- [ ] Can delete source with confirmation
- [ ] Can move source to a bucket via dropdown
- [ ] Empty inbox shows helpful empty state with Cmd+K hint and capture button
- [ ] New sources appear in inbox immediately after capture
- [ ] Embeddings generate automatically in background after creation
- [ ] Embeddings regenerate after content edit
- [ ] Page styled with Specter design system (bg-card cards, Ghost Cyan accents, type badges)
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] No console errors
- [ ] Responsive: works on mobile
- [ ] Git committed with proper message

---

## Reference Files

| File | What to look at |
|------|----------------|
| `lib/types.ts` | `Source`, `SourceType`, `CreateSourceInput` — your data shapes |
| `lib/embeddings.ts` | `embedText()`, `truncateForEmbedding()` — already built |
| `app/api/embed/route.ts` | Embedding route — already built, accepts `sourceId` or `sourceIds` |
| `lib/supabase/server.ts` | Server client pattern for API routes |
| `lib/supabase/client.ts` | Client-side reads with RLS |
| `app/globals.css` | Design tokens — `bg-card`, `bg-popover`, `text-primary`, etc. |
| `components/ui/button.tsx` | shadcn Button pattern |
| `components/layout/AppShell.tsx` | Where to wire Cmd+K and CaptureModal |
| `components/layout/Sidebar.tsx` | Where the "+" capture button lives |
| `claude-code-agent-instructions.md` | Coding conventions |
| `technical-architecture-and-database-schema.md` | Full schema for sources table |

---

## Notes for the Agent

- **shadcn components to install:** `dialog`, `dropdown-menu`, `badge`, `textarea`, `select`, `label`. Run `npx shadcn@latest add <name>` for each.
- **Token naming:** Ghost Cyan = `bg-primary` / `text-primary`. Cards = `bg-card`. Modal surface = `bg-popover`. Muted text = `text-muted-foreground`.
- **Fire-and-forget embedding:** The POST source route calls `/api/embed` but does NOT await it. Use `.catch()` to swallow errors — embedding failures shouldn't block source creation.
- **Cookie forwarding:** When calling `/api/embed` from within the sources API route, forward the `cookie` header from the original request so the embed route can authenticate.
- **`params` in Next.js 14:** Route params are a Promise. Use `const { id } = await params`.
- **Bulk create:** The POST route accepts either a single object or an array. The modal sends an array when bulk-splitting.
- **Optimistic UI:** After creating a source, either optimistically add it to the inbox list state, or refetch. Refetch is simpler for V1.
- **Component organization:** Put capture-related components in `components/capture/` and inbox-related in `components/inbox/`. Keep files under ~150 lines.
- **AppShell conversion:** AppShell may need to become a client component to support Cmd+K and modal state. If that's too invasive, create a thin client wrapper component.
- **Don't over-engineer:** This is V1 for 2 users. No infinite scroll, no search within inbox, no drag-and-drop sorting. Simple list with CRUD actions.
- **Tailwind v4:** Use CSS-based config. Don't create `tailwind.config.ts` changes.
