# Code Review Report — 2026-02-07 — Tasks 1–7 (Full Phase 0–2)

## Summary
- **Total findings: 28**
- **Critical: 0 | High: 5 | Medium: 16 | Low: 7**
- **Deployment ready: CONDITIONAL** — Fix the 5 HIGH issues before building Tasks 8a/8b. The AI core will build on top of these foundations.

### What's Clean
- **Stale architecture: ZERO dead terms** in functional code. The three-agent → two-mode migration is fully clean.
- **Route wiring: 100%** — every client `fetch()` has a matching handler, body/response shapes match.
- **Auth: All implemented routes check auth.** No unprotected endpoints.
- **Encryption: AES-256-GCM with random IV + auth tag.** Correct algorithm, correct implementation.
- **API key never exposed** — GET returns `{ hasKey: boolean }` only.
- **TypeScript: Zero errors.** Build passes clean.
- **No secrets in client code.** No service role keys, no API keys, no hardcoded UUIDs.

---

## High Findings

### [H1] Bucket detail page fetches own API without cookies — will break in production
- **File(s):** `app/buckets/[id]/page.tsx` (lines 9-23)
- **Issue:** Server component calls `fetch('/api/buckets/${id}')` without forwarding cookies. The API routes require auth, so this returns 401 in production (no session context in server-side fetch).
- **Expected:** Server components should call Supabase directly via `createClient()`, not fetch their own API routes.
- **Fix:** Replace `getBucketDetail()` fetch pattern with direct Supabase queries using `createClient()` from `lib/supabase/server.ts`, or convert to a client component that fetches via the API.

### [H2] CaptureProvider doesn't pass `onCaptureSuccess` — Cmd+K captures never refresh UI
- **File(s):** `components/capture/CaptureProvider.tsx` (line 40)
- **Issue:** When Cmd+K is used to capture a source, the CaptureModal has no callback to notify the current page. The inbox/bucket views don't refresh after capture — user must manually reload.
- **Expected:** After successful capture, the current page should refetch its data.
- **Fix:** Add an event-based approach (e.g., custom event, or a `refreshKey` state in the provider that pages can subscribe to) so any page can react to a successful capture.

### [H3] Inconsistent base URL env vars — two different names for same value
- **File(s):** `app/buckets/[id]/page.tsx` uses `NEXT_PUBLIC_BASE_URL`; `app/api/sources/route.ts` and `app/api/sources/[id]/route.ts` use `NEXT_PUBLIC_APP_URL`
- **Issue:** Two different env var names reference the same concept. In production, one will be set and the other undefined, causing `localhost:3000` fallback.
- **Fix:** Pick ONE name (`NEXT_PUBLIC_APP_URL`) and use it everywhere. Remove the other.

### [H4] AppShell doesn't handle profile query failure
- **File(s):** `components/layout/AppShell.tsx` (lines 22-26)
- **Issue:** The Supabase profile query destructures `{ data: profile }` without checking `error`. If the profile doesn't exist (new user, trigger hasn't run), `profile` is null and gets passed to TopBar, potentially causing runtime crashes.
- **Fix:** Check for `error` or null profile, show a fallback state or redirect to onboarding.

### [H5] Sidebar "Conversations" link → 404
- **File(s):** `components/layout/Sidebar.tsx` (line 22)
- **Issue:** Nav links to `/conversations` but no `app/conversations/page.tsx` exists. Only `app/conversations/[id]/page.tsx` exists. Clicking "Conversations" in the sidebar produces a 404.
- **Fix:** Create `app/conversations/page.tsx` (even as a minimal stub/placeholder listing page), or update the sidebar link.

---

## Medium Findings

### [M1] Embedding generation is fire-and-forget with silent failure
- **File(s):** `app/api/sources/route.ts` (line 77)
- **Issue:** If the embedding call fails (OpenAI key missing, network error), the source is created but never embedded — invisible to semantic search. No retry, no user feedback.
- **Fix:** For V1, acceptable if documented. For robustness, consider a `needs_embedding` boolean column or a background job. At minimum, log a warning the user could see.

### [M2] Bucket PATCH/DELETE don't check `owner_id`
- **File(s):** `app/api/buckets/[id]/route.ts` (lines 72, 95)
- **Issue:** Any authenticated user can update or delete any bucket. Per PRD, buckets are workspace-wide for READ, but writes should probably still check ownership.
- **Note:** For a 2-person team this is low risk, but it's inconsistent with how sources are protected. RLS at the DB level may already handle this — verify.

### [M3–M6] Missing error states on data pages
- **Inbox** (`InboxView.tsx`): API failure shows empty state instead of error message
- **Bucket list** (`BucketListView.tsx`): Same pattern
- **Bucket detail** (`BucketDetailView.tsx`): Partial — handles 404 but not fetch failures
- **Settings** (`SettingsPanel.tsx`): Error toast auto-dismisses, leaving user with stale data

### [M7–M10] Native `alert()` used for error feedback
- **CaptureModal.tsx** (line 117)
- **SourceCard.tsx** (lines 59, 77, 93)
- **BucketDetailView.tsx** (lines 72, 112, 127)
- **CreateBucketModal.tsx** (line 69)
- **Issue:** Inconsistent with SettingsPanel which uses a proper toast pattern. Native alerts are jarring.

### [M11] 14 instances of `as any` where proper types exist
- **Files:** Across API routes, CaptureModal, InboxView, SourceCard, CreateBucketModal, embed route
- **Issue:** `Bucket[]`, `Source[]`, `CreateSourceInput` types exist in `lib/types.ts` but aren't consistently used.

### [M12] `Profile` type intentionally missing `anthropic_api_key_encrypted`
- **File:** `lib/types.ts`
- **Issue:** Correct for client safety, but undocumented. Server-side code working with full profile rows has no typed interface.
- **Fix:** Add a comment, or create a server-side `ProfileRow` type.

### [M13] Missing error checks on several Supabase queries
- **Files:** `AppShell.tsx`, `SettingsPanel.tsx`, `buckets/[id]/route.ts` (cascading queries), `buckets/route.ts` (helper queries)
- **Issue:** Errors are destructured away; failures silently produce empty/default data.

### [M14] `onDelete` signature mismatch in BucketDetailView
- **File:** `components/buckets/BucketDetailView.tsx`
- **Issue:** SourceCard expects `onDelete: (id: string) => void` but receives `refreshSources: () => Promise<void>`. Works at runtime (extra arg ignored) but is a type mismatch.

### [M15] No `.env.example` file
- **Issue:** No documentation of required env vars. New developer or Vercel deploy has no reference.
- **Needed vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `ENCRYPTION_SECRET`, `NEXT_PUBLIC_APP_URL`

### [M16] Bucket detail + inbox not responsive on mobile
- **Files:** `InboxView.tsx` (fixed `p-8`, no responsive adjustments), `BucketDetailView.tsx` (header layout doesn't stack on mobile)

---

## Low Findings

### [L1] No `.env.example` for `ENCRYPTION_SECRET` — missing causes unhandled 500
### [L2] Dashboard not reachable from sidebar (logo is `<img>`, not `<Link>`)
### [L3] `app/drafts/[id]/page.tsx` is bare stub without AppShell wrapper
### [L4] `Source` type has unused `owner_name` joined field (never populated)
### [L5] Mixed font loading (Clash Display local, Manrope + JetBrains from Google CDN)
### [L6] Next.js 16 middleware deprecation warning (works but flagged)
### [L7] `console.error` in API routes could leak stack traces in production

---

## Trace Results

| Trace | Status | Notes |
|---|---|---|
| 1. Source Capture → Embedding | **PARTIAL** | Sources reach DB correctly. Embedding fires but can silently fail. UI doesn't auto-refresh after Cmd+K capture. |
| 2. Explore Conversation | **N/A** | Task 8a not built yet |
| 3. Draft Mode | **N/A** | Task 8b not built yet |
| 4. Draft Repurposing | **N/A** | Not built yet |
| 5. Cross-User Visibility | **N/A** | Not tested (RLS policies exist but not verified end-to-end) |
| 6. API Key Round-Trip | **PASS** | Encrypt → store → decrypt path is correct. Settings UI shows proper status. Chat route is a stub (expected). |

---

## Prioritized Fix Plan

**Before starting Tasks 8a/8b (fix these first):**

| Priority | Finding | Effort | Why now |
|----------|---------|--------|---------|
| 1 | H1: Bucket detail server fetch | 15 min | Currently broken — page won't work in production |
| 2 | H3: Standardize base URL env var | 5 min | Task 8 API routes will need this |
| 3 | H5: Missing `/conversations` page | 5 min | Create a stub so sidebar link doesn't 404 |
| 4 | H2: CaptureProvider refresh callback | 20 min | Users will capture sources constantly — they need to see them |
| 5 | H4: AppShell profile null check | 10 min | Could crash entire app layout |
| 6 | M15: Create `.env.example` | 5 min | Quick win, helps deploy |

**Fix during or after Tasks 8a/8b:**
- M1 (embedding retry), M2 (bucket ownership), M3-M6 (error states), M7-M10 (replace alert() with toasts), M11 (type cleanup), M13 (error checks)

---

## Files Reviewed (41 total)

### App Routes
`app/page.tsx`, `app/layout.tsx`, `app/login/page.tsx`, `app/inbox/page.tsx`, `app/settings/page.tsx`, `app/buckets/page.tsx`, `app/buckets/[id]/page.tsx`, `app/conversations/[id]/page.tsx`, `app/drafts/page.tsx`, `app/drafts/[id]/page.tsx`

### API Routes
`app/api/sources/route.ts`, `app/api/sources/[id]/route.ts`, `app/api/embed/route.ts`, `app/api/buckets/route.ts`, `app/api/buckets/[id]/route.ts`, `app/api/settings/api-key/route.ts`, `app/api/settings/voice-profile/route.ts`, `app/api/settings/voice-config/[id]/route.ts`, `app/api/settings/models/route.ts`, `app/api/conversations/route.ts`, `app/api/conversations/[id]/route.ts`, `app/api/chat/route.ts`, `app/api/drafts/route.ts`, `app/api/auth/logout/route.ts`

### Components
`components/layout/AppShell.tsx`, `components/layout/Sidebar.tsx`, `components/layout/TopBar.tsx`, `components/layout/LogoutButton.tsx`, `components/layout/icons.tsx`, `components/capture/CaptureModal.tsx`, `components/capture/CaptureProvider.tsx`, `components/inbox/InboxView.tsx`, `components/inbox/SourceCard.tsx`, `components/buckets/BucketListView.tsx`, `components/buckets/BucketDetailView.tsx`, `components/buckets/CreateBucketModal.tsx`, `components/settings/SettingsPanel.tsx`, `components/ui/button.tsx`

### Libraries
`lib/types.ts`, `lib/utils.ts`, `lib/format.ts`, `lib/encryption.ts`, `lib/embeddings.ts`, `lib/supabase/server.ts`, `lib/supabase/client.ts`
