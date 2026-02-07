# Review Fixes — Pre-Task 8 Cleanup

**Status:** NOT STARTED
**Dependencies:** None (all existing code)
**Agent type:** Builder (Sonnet)
**Estimated effort:** ~1 hour, single session
**Reference:** `docs/code-review-2026-02-07.md` — full review report

---

## Objective

Fix the 5 HIGH findings and 1 quick-win MEDIUM from the code review before building the AI core (Tasks 8a/8b). These are foundation issues that would cause bugs or crashes if left unfixed.

This is a **coding task.** You are fixing specific bugs and gaps — not refactoring or adding features.

---

## Before You Start

Read these files in order:

1. `docs/code-review-2026-02-07.md` — The full review report. Understand what was found and why.
2. `claude-code-agent-instructions.md` — Coding conventions
3. `lib/supabase/server.ts` — Server-side Supabase client pattern
4. `lib/types.ts` — Type definitions

---

## Fix 1: Bucket detail page fetches own API without cookies [H1]

**File:** `app/buckets/[id]/page.tsx`

**Problem:** The server component calls `fetch('/api/buckets/${id}')` without forwarding cookies. API routes require auth, so this will return 401 in production — the page will be empty or broken.

**Fix:** Replace the `fetch()` pattern with direct Supabase queries using `createClient()` from `lib/supabase/server.ts`. Server components can query Supabase directly — they don't need to go through API routes.

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import BucketDetailView from '@/components/buckets/BucketDetailView'

export default async function BucketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch bucket directly — no API route needed
  const { data: bucket, error } = await supabase
    .from('buckets')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !bucket) notFound()

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

  // Fetch all buckets (for "Move to bucket" dropdown in SourceCards)
  const { data: allBuckets } = await supabase
    .from('buckets')
    .select('id, name, color')
    .order('sort_order', { ascending: true })

  return (
    <AppShell>
      <BucketDetailView
        bucket={bucket}
        initialSources={sources ?? []}
        initialDrafts={drafts ?? []}
        initialConversations={conversations ?? []}
        allBuckets={allBuckets ?? []}
      />
    </AppShell>
  )
}
```

**Important:** This changes how BucketDetailView receives data. Currently it may fetch everything client-side on mount. Update BucketDetailView to accept these props as initial data, and only refetch on user actions (edit, delete, move). The key change:

- BucketDetailView should accept `bucket`, `initialSources`, `initialDrafts`, `initialConversations`, `allBuckets` as props
- Initialize state from these props: `useState(initialSources)` etc.
- Keep the existing refresh functions for user-triggered updates (move source, delete, etc.)
- Remove any `useEffect` that fetches bucket data on mount — the server component already provides it

Also **delete** the `getBucketDetail()` function and any `NEXT_PUBLIC_BASE_URL` references in this file.

---

## Fix 2: CaptureProvider doesn't refresh UI after capture [H2]

**File:** `components/capture/CaptureProvider.tsx`

**Problem:** When Cmd+K is used to capture a source, no callback fires to refresh the current page. The InboxView and BucketDetailView don't know a new source was created.

**Fix:** Add a `captureVersion` counter to the CaptureProvider context. Increment it on every successful capture. Pages can subscribe to this counter and refetch when it changes.

1. In `CaptureProvider.tsx`, add to the context:
   ```typescript
   interface CaptureContextType {
     openCapture: () => void
     captureVersion: number  // increments on every successful capture
   }
   ```

2. Add state: `const [captureVersion, setCaptureVersion] = useState(0)`

3. Pass an `onCaptureSuccess` callback to `CaptureModal`:
   ```typescript
   <CaptureModal
     open={open}
     onOpenChange={setOpen}
     onCaptureSuccess={() => setCaptureVersion(v => v + 1)}
   />
   ```

4. Expose `captureVersion` in the context value.

5. In `components/inbox/InboxView.tsx`, subscribe to captureVersion:
   ```typescript
   const { openCapture, captureVersion } = useCaptureModal()

   useEffect(() => {
     fetchSources()
     fetchBuckets()
   }, [captureVersion])  // refetch when capture happens
   ```

6. Do the same in `components/buckets/BucketDetailView.tsx` — refetch sources when `captureVersion` changes (the user might have captured directly into this bucket).

---

## Fix 3: Standardize base URL env var [H3]

**Problem:** Two different env var names for the same value:
- `app/buckets/[id]/page.tsx` uses `NEXT_PUBLIC_BASE_URL`
- `app/api/sources/route.ts` uses `NEXT_PUBLIC_APP_URL`
- `app/api/sources/[id]/route.ts` uses `NEXT_PUBLIC_APP_URL`

**Fix:**
1. After Fix 1, `app/buckets/[id]/page.tsx` no longer uses `NEXT_PUBLIC_BASE_URL` — it queries Supabase directly. Verify this reference is gone.
2. The API routes (`app/api/sources/route.ts` and `app/api/sources/[id]/route.ts`) use `NEXT_PUBLIC_APP_URL` as a fallback for the internal embed call. This is fine — keep `NEXT_PUBLIC_APP_URL` as the standard name.
3. Grep the entire codebase for `NEXT_PUBLIC_BASE_URL`. If any references remain, change them to `NEXT_PUBLIC_APP_URL`.
4. In `.env.local`, ensure `NEXT_PUBLIC_APP_URL=http://localhost:3000` exists (or whatever the correct value is).

---

## Fix 4: AppShell doesn't handle null profile [H4]

**File:** `components/layout/AppShell.tsx`

**Problem:** The profile query doesn't check for errors or null. If the profile doesn't exist, `profile` is null and gets passed to TopBar, potentially crashing the layout.

**Fix:** Add error/null handling:

```typescript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/login')
}

const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

// If profile doesn't exist or query fails, use a safe fallback
const safeProfile = profile ?? {
  id: user.id,
  display_name: user.email?.split('@')[0] ?? 'User',
  avatar_url: null,
  personal_voice_profile: [],
  explore_model: 'claude-opus-4-5-20250929',
  draft_model: 'claude-sonnet-4-20250514',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
```

Pass `safeProfile` to TopBar instead of `profile`. This ensures the layout never crashes even if the DB trigger that creates the profile hasn't run yet.

---

## Fix 5: Sidebar "Conversations" link → 404 [H5]

**Problem:** Sidebar links to `/conversations` but no `app/conversations/page.tsx` exists. Only `app/conversations/[id]/page.tsx` exists.

**Fix:** Create `app/conversations/page.tsx` as a proper stub:

```typescript
import AppShell from '@/components/layout/AppShell'

export default function ConversationsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="mb-2">Conversations</h1>
        <p className="text-muted-foreground">
          Start a conversation from any bucket to begin exploring and drafting.
        </p>
      </div>
    </AppShell>
  )
}
```

This prevents the 404. The full conversations list UI comes in Task 9.

---

## Fix 6 (Quick Win): Create `.env.example` [M15]

**Problem:** No documentation of required environment variables.

**Fix:** Create `.env.example` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI (for embeddings)
OPENAI_API_KEY=your-openai-api-key

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_SECRET=your-64-char-hex-string

# App URL (used for internal API calls in production)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing

After all fixes:

1. `pnpm tsc --noEmit` — zero errors
2. `pnpm build` — completes without errors
3. `pnpm dev` and verify:
   - Navigate to `/buckets` → create a bucket → click into it → page loads with data (Fix 1)
   - Press Cmd+K → capture a source → inbox auto-refreshes to show it (Fix 2)
   - Press Cmd+K from a bucket detail → capture into that bucket → source list refreshes (Fix 2)
   - Navigate to `/conversations` → stub page renders, no 404 (Fix 5)
   - Log in as a fresh user → layout doesn't crash (Fix 4)
4. Grep for `NEXT_PUBLIC_BASE_URL` — should have zero results (Fix 3)
5. Verify `.env.example` exists in project root (Fix 6)

---

## Commit

```bash
git add -A
git commit -m "Review fixes: bucket detail direct queries, capture refresh, env var cleanup, null safety, conversations stub, .env.example"
```

---

## Acceptance Criteria

- [ ] `app/buckets/[id]/page.tsx` queries Supabase directly (no `fetch()` to own API)
- [ ] No references to `NEXT_PUBLIC_BASE_URL` remain in codebase
- [ ] BucketDetailView accepts server-provided data as props
- [ ] CaptureProvider exposes `captureVersion` counter
- [ ] CaptureModal calls `onCaptureSuccess` after successful capture
- [ ] InboxView refetches when `captureVersion` changes
- [ ] BucketDetailView refetches sources when `captureVersion` changes
- [ ] All references standardized to `NEXT_PUBLIC_APP_URL`
- [ ] `.env.local` has `NEXT_PUBLIC_APP_URL` set
- [ ] AppShell handles null profile with safe fallback
- [ ] `app/conversations/page.tsx` exists and renders with AppShell
- [ ] `.env.example` exists with all required vars documented
- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm build` passes
- [ ] No console errors in dev

---

## Notes for the Agent

- **Do NOT refactor anything beyond these 6 fixes.** The review found 16 MEDIUM and 7 LOW issues — those are intentionally deferred. Don't fix them.
- **Don't touch API routes** (except removing `NEXT_PUBLIC_BASE_URL` references). The routes are wired correctly per the review.
- **BucketDetailView refactor is the biggest change.** It needs to accept props from the server component instead of fetching everything on mount. Keep the client-side refetch functions for user actions — just change the initial data source.
- **The `captureVersion` pattern is simple and effective.** Don't over-engineer it with a full event bus or state management library. A counter in context that pages subscribe to via `useEffect` dependency array is sufficient.
- **Test the bucket detail page carefully.** The Fix 1 change affects how data flows into the component. Make sure move-to-bucket, edit, delete, and "Start Conversation" still work after the refactor.
