# UX Fixes — Home Navigation, Scrollable Textarea, Source Titles

**Date:** 2026-02-07
**Status:** Complete ✓

---

## Issue 1: No Home Navigation ✓

**Problem:** Once you navigate away from the home page (`/`), there's no way to get back to it through the UI.

**Solution:** Made the Specter logo/brand clickable in the sidebar. Clicking it now navigates to `/`.

**Files Changed:**
- `components/layout/Sidebar.tsx`
  - Wrapped logo/title `<div>` in a `<Link href="/">` component
  - Added hover effect (`hover:bg-accent/50`) for better UX

---

## Issue 2: Content Textarea Not Scrollable ✓

**Problem:** When pasting large amounts of content into the capture modal, the textarea expands infinitely with no height constraint, making the modal taller than the viewport and unusable.

**Solution:** Added `max-h-[300px] overflow-y-auto` to the textarea so it:
- Starts at 120px min height
- Grows up to 300px max height
- Scrolls internally when content exceeds 300px

**Files Changed:**
- `components/capture/CaptureModal.tsx`
  - Updated textarea className: `min-h-[120px] max-h-[300px] overflow-y-auto`

---

## Issue 3: Sources Have No Title ✓

**Problem:** Sources display as raw content with 3-line truncation, making the inbox hard to scan. No way to add titles manually or auto-generate them.

**Solution:** Implemented a complete title system:

### 3.1 Storage
- Titles are stored in the existing `metadata` JSONB field (no migration needed)
- Updated `Source` type to properly type `metadata: { title?: string; [key: string]: any }`

### 3.2 Capture Modal
- Added optional "Title" input field above content textarea
- Passes title to API when provided
- If no title provided, API auto-generates one

### 3.3 Auto-Title Generation
- Simple truncation algorithm (60-80 chars, cut at word boundary)
- Implemented in `app/api/sources/route.ts` as `generateSimpleTitle()`
- Runs on every source creation
- Can be upgraded to AI-powered generation later (like conversations)

### 3.4 Display
- SourceCard now displays title prominently as a heading (`<h3>`)
- If no title exists, falls back to showing just content (backwards compatible)
- Content shown below title in muted color with 3-line clamp

### 3.5 Editing
- Added title input to edit mode in SourceCard
- Can edit both title and content
- PATCH endpoint supports title updates via metadata

**Files Changed:**
- `components/capture/CaptureModal.tsx`
  - Added `title` state
  - Added title input field
  - Passes title to API
  - Resets title on form reset

- `components/inbox/SourceCard.tsx`
  - Added `editedTitle` state
  - Displays title prominently if exists
  - Added title input in edit mode
  - Updates both title and content on save

- `app/api/sources/route.ts`
  - Added `generateSimpleTitle()` helper function
  - Auto-generates title from content if not provided
  - Stores title in metadata on create

- `app/api/sources/[id]/route.ts`
  - Added title update support in PATCH
  - Merges title into existing metadata

- `lib/types.ts`
  - Updated `Source` interface: `metadata: { title?: string; [key: string]: any }`
  - Updated `CreateSourceInput` to include optional `title` field

---

## Testing

All changes tested:
- ✅ TypeScript compilation: `pnpm tsc --noEmit` (no errors)
- ✅ ESLint: `pnpm next lint` (no errors)
- ✅ Backwards compatible: sources without titles still render correctly

---

## User Experience Improvements

1. **Navigation:** Users can now easily return to the home dashboard by clicking the Specter logo
2. **Capture:** Large content pastes are now usable with scrollable textarea
3. **Organization:** Inbox is now scannable with prominent titles on each source
4. **Flexibility:** Users can add custom titles or rely on auto-generated ones

---

## Future Enhancements (Optional)

- Upgrade auto-title generation to use Haiku (AI-powered, like conversations)
- Add title search/filter in inbox
- Show title in bucket detail source lists
- Add keyboard shortcut to jump to home (Cmd+H)
