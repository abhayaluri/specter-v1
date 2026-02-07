# Task 12 — Dashboard (Landing Page)

**Status:** READY
**Dependencies:** Task 6 (Sources), Task 7 (Buckets), Task 10 (Drafts)
**Agent type:** Builder

---

## Objective

Build the dashboard landing page (`/`) that serves as the home base for the content engine. Shows overview stats, quick links to buckets, inbox preview, and recent activity.

After this task, users land on a dashboard that gives them context on their content library at a glance and quick access to all key areas.

---

## Architecture Context

```
User logs in → redirected to /
    ↓
Dashboard shows:
    - Stats: source count, draft count by status, inbox count
    - Bucket grid: all buckets with source/draft counts
    - Inbox preview: latest 5 unsorted sources
    - Recent conversations: last 5 conversations with timestamps
    ↓
Click bucket → /buckets/[id]
Click source → /inbox (with source highlighted)
Click conversation → /conversations/[id]
Click draft → /drafts/[id]
```

**Key concept:** Dashboard is a read-only aggregation view. It queries existing tables (sources, buckets, drafts, conversations) and displays summaries with links to detail pages.

---

## What This Task Does NOT Do

- **NOT creating sources/buckets/drafts** — those have their own pages
- **NOT editing anything** — dashboard is view-only with quick links
- **NOT conversations** — that's Task 9
- **NOT draft management** — that's Task 11

This task is ONLY the landing page: `app/page.tsx` + dashboard components.

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `app/page.tsx` | Dashboard landing page (MODIFY — currently placeholder) |
| `components/dashboard/StatsCards.tsx` | Overview stats cards |
| `components/dashboard/BucketGrid.tsx` | Bucket quick links with counts |
| `components/dashboard/InboxPreview.tsx` | Latest unsorted sources preview |
| `components/dashboard/RecentConversations.tsx` | Recent conversation list |

**File ownership (parallel execution):** This task owns `app/page.tsx` and `components/dashboard/*`. Task 11 owns `app/drafts/*`. No conflicts.

---

## Page Contract

### `/` — Dashboard Landing Page

**Layout (4 sections):**

1. **Stats Cards** (top row, 4 cards)
2. **Bucket Grid** (main area, left)
3. **Inbox Preview** (main area, right)
4. **Recent Conversations** (bottom)

**Responsive:**
- Desktop: 2-column layout (bucket grid left, inbox right)
- Mobile: Stack vertically

---

## Component Contracts

### StatsCards

Shows 4 key metrics in a horizontal row.

**Stats to show:**
1. **Total Sources** — count from `sources` table where `owner_id = user.id`
2. **Drafts** — count from `drafts` table, grouped by status:
   - "X drafts" with breakdown: "Y draft, Z ready, W published"
3. **Inbox** — count from `sources` table where `bucket_id IS NULL`
4. **Buckets** — count from `buckets` table where `owner_id = user.id`

**Card design:**
- Icon + label + count
- Ghost Cyan accent on hover
- Click to navigate (e.g., Total Sources → /inbox, Drafts → /drafts)

**Data fetching:**
```typescript
// Fetch in server component:
const stats = {
  totalSources: await supabase.from('sources').select('*', { count: 'exact', head: true }),
  inbox: await supabase.from('sources').select('*', { count: 'exact', head: true }).is('bucket_id', null),
  drafts: await supabase.from('drafts').select('status'),
  buckets: await supabase.from('buckets').select('*', { count: 'exact', head: true }),
}
```

**Acceptance criteria:**
- [ ] Shows total source count
- [ ] Shows draft count with status breakdown
- [ ] Shows inbox count (unsorted sources)
- [ ] Shows bucket count
- [ ] Click card navigates to relevant page

---

### BucketGrid

Shows all user's buckets in a grid (same cards as `/buckets` list page).

**Bucket card shows:**
- Bucket name
- Bucket color (left border accent)
- Source count
- Draft count
- Click → `/buckets/[id]`

**Data fetching:**
```typescript
// Fetch buckets with counts:
const buckets = await supabase
  .from('buckets')
  .select(`
    *,
    sources:sources(count),
    drafts:drafts(count)
  `)
  .eq('owner_id', user.id)
  .order('updated_at', { ascending: false })
```

**Empty state:** "No buckets yet. Create your first bucket to organize sources."

**Acceptance criteria:**
- [ ] Shows all user's buckets
- [ ] Each card shows name, color, source count, draft count
- [ ] Click navigates to `/buckets/[id]`
- [ ] Empty state when no buckets

---

### InboxPreview

Shows the 5 most recent unsorted sources (sources where `bucket_id IS NULL`).

**Source card shows:**
- Content preview (first 2 lines)
- Source type badge (note, link, tweet, etc.)
- Timestamp (relative)
- Click → `/inbox` (with that source in view)

**Data fetching:**
```typescript
// Fetch latest unsorted sources:
const inboxSources = await supabase
  .from('sources')
  .select('*')
  .eq('owner_id', user.id)
  .is('bucket_id', null)
  .order('created_at', { ascending: false })
  .limit(5)
```

**Footer:** "View all inbox sources →" link to `/inbox`

**Empty state:** "Inbox is empty. All sources are organized!"

**Acceptance criteria:**
- [ ] Shows 5 most recent unsorted sources
- [ ] Each card shows preview, type badge, timestamp
- [ ] Click navigates to `/inbox`
- [ ] "View all" link to full inbox
- [ ] Empty state when inbox is empty

---

### RecentConversations

Shows the 5 most recent conversations (any mode, any bucket).

**Conversation card shows:**
- Title (from `conversations.title`, or "Untitled conversation")
- Mode badge (Explore / Draft)
- Bucket name (if `bucket_id` exists)
- Timestamp (relative)
- Message count (from `messages` table)
- Click → `/conversations/[id]`

**Data fetching:**
```typescript
// Fetch recent conversations:
const conversations = await supabase
  .from('conversations')
  .select(`
    *,
    bucket:buckets(name, color),
    messages:messages(count)
  `)
  .eq('owner_id', user.id)
  .order('updated_at', { ascending: false })
  .limit(5)
```

**Footer:** "View all conversations →" link (future: `/conversations` list page, stub for V1)

**Empty state:** "No conversations yet. Start a conversation from a bucket."

**Acceptance criteria:**
- [ ] Shows 5 most recent conversations
- [ ] Each card shows title, mode, bucket, timestamp, message count
- [ ] Click navigates to `/conversations/[id]`
- [ ] Empty state when no conversations

---

## Design Patterns to Follow

**Reference existing pages:**
- `/buckets` — bucket cards pattern
- `/inbox` — source cards pattern
- Stats cards — simple icon + label + count

**Follow Specter design system:**
- Ghost Cyan (`--primary`) for accents and hover states
- True Black (`--bg`) background
- Clash Display for page heading
- Manrope for body text
- shadcn/ui components: Card, Badge

**Layout:**
- Generous spacing (8px grid)
- Cards with subtle borders and hover states
- Empty states with helpful prompts

---

## Acceptance Criteria

**Stats cards:**
- [ ] Shows total sources, drafts (with status breakdown), inbox count, bucket count
- [ ] Click navigates to relevant page

**Bucket grid:**
- [ ] Shows all user's buckets with source/draft counts
- [ ] Click navigates to bucket detail
- [ ] Empty state when no buckets

**Inbox preview:**
- [ ] Shows 5 most recent unsorted sources
- [ ] Click navigates to inbox
- [ ] "View all" link works
- [ ] Empty state when inbox is empty

**Recent conversations:**
- [ ] Shows 5 most recent conversations
- [ ] Shows title, mode, bucket, timestamp, message count
- [ ] Click navigates to conversation
- [ ] Empty state when no conversations

**Infrastructure:**
- [ ] No TypeScript errors
- [ ] Follows Specter design system
- [ ] Uses shadcn/ui components
- [ ] Server component for data fetching (no client-side loading states needed for V1)
- [ ] Responsive layout (2-col desktop, stack mobile)

---

## Reference Files

| File | What to look for |
|------|-----------------|
| `builder-agent-guide.md` | Builder autonomy vs contracts |
| `claude-code-agent-instructions.md` | Coding conventions, Specter design tokens |
| `lib/types.ts` | `Source`, `Bucket`, `Draft`, `Conversation` types |
| `lib/supabase/server.ts` | Server-side Supabase client for data fetching |
| `app/buckets/page.tsx` | Bucket card pattern |
| `app/inbox/page.tsx` | Source card pattern |
| `components/buckets/BucketCard.tsx` | Bucket card component (reuse if helpful) |
| `components/sources/SourceCard.tsx` | Source card component (reuse if helpful) |

---

## Notes for Builder

- **This is a read-only aggregation view.** No mutations, just queries and links.
- **Reuse existing components** — BucketCard and SourceCard from Tasks 6+7 can be imported and reused.
- **Server component is fine** — no need for client-side data fetching, loading states, or mutations. Just render the data.
- **Empty states matter** — each section should have a helpful empty state with a CTA ("Create your first bucket", etc.)
- **Keep it simple** — this is an overview page. Don't over-engineer. Follow existing patterns from `/buckets` and `/inbox`.
