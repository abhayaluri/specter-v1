# Task 9 — Conversation UI (Chat Interface + Streaming + Mode Switching)

**Status:** READY
**Dependencies:** Task 8c (Chat Router) COMPLETE, Task 7 (Buckets) COMPLETE
**Agent type:** Builder
**Estimated scope:** ~15 new/modified files, largest UI task remaining

---

## Objective

Build the conversation interface — the primary screen where users do their work. This is a split-pane layout: chat thread on the left, context panel (sources or draft) on the right. Users can start conversations, send messages with real-time streaming, switch between Explore and Draft modes, and see retrieved sources or extracted drafts.

After this task, the core product loop works: Capture sources → Organize into buckets → Explore angles with Opus → Draft content with Sonnet.

---

## Architecture Context

```
User interacts with conversation UI
    ↓
ConversationPage (server component) — fetches conversation + messages via GET /api/conversations/[id]
    ↓
ChatInterface (client component) — manages chat state
    ├─ MessageList — renders conversation history
    ├─ MessageInput — captures user input, sends via useChatStream hook
    ├─ ConversationHeader — mode toggle, voice, platform, back button
    └─ ContextPanel (right pane):
        ├─ SourcePanel (Explore mode) — shows retrieved sources with categories
        └─ DraftPreview (Draft mode) — shows extracted draft content
    ↓
useChatStream hook — POST /api/chat → consumes SSE stream → updates state
    ↓
API responses:
    ├─ SSE: { type: 'sources', sources: [...] }     ← Explore only
    ├─ SSE: { type: 'text', text: '...' }           ← repeated chunks
    ├─ SSE: { type: 'done', messageId, draft }       ← final
    └─ SSE: { type: 'error', error: '...' }          ← on failure
```

---

## API Contracts (what the UI consumes)

These endpoints are BUILT (Task 8c). The UI calls them — do not modify them.

### GET /api/conversations
Returns `{ conversations: Conversation[] }`. Supports query params: `?bucketId=X&mode=explore`.

### POST /api/conversations
Body: `{ bucketId?, mode?, platform?, includeAllBuckets? }`. Returns `{ conversation: Conversation }` with status 201.

### GET /api/conversations/[id]
Returns `{ conversation: Conversation, messages: Message[] }`. Messages ordered by created_at asc.

### PATCH /api/conversations/[id]
Body: `{ title?, mode?, platform?, includeAllBuckets?, bucketId? }`. Returns `{ conversation: Conversation }`.

### POST /api/chat
Body: `SendMessageInput` (see `lib/types.ts`). Returns SSE stream.

**SSE event format — this is the critical integration contract:**

| Event | Shape | When |
|-------|-------|------|
| Sources | `{ type: 'sources', sources: RetrievedSource[] }` | First event, Explore mode only, if sources exist |
| Text | `{ type: 'text', text: string }` | Repeated during streaming |
| Done | `{ type: 'done', messageId: string, draft: ExtractedDraft \| null }` | After stream completes + messages persisted |
| Error | `{ type: 'error', error: string }` | On failure |

`ExtractedDraft = { platform: string, title: string, content: string }`

---

## Files to Create/Modify

### Pages (modify existing stubs)

| File | Action |
|------|--------|
| `app/conversations/page.tsx` | Replace stub — conversation list with "New Conversation" button |
| `app/conversations/[id]/page.tsx` | Replace stub — server component that fetches data, renders ChatInterface |

### New Components

| File | Purpose |
|------|---------|
| `components/conversations/ConversationListView.tsx` | List of conversations, filters, empty state, "New Conversation" CTA |
| `components/conversations/NewConversationModal.tsx` | Modal: mode selection (Explore/Draft), bucket, voice, platform (if Draft) |
| `components/conversations/ChatInterface.tsx` | Main client component — orchestrates chat state, layout, mode |
| `components/conversations/ConversationHeader.tsx` | Top bar: mode toggle, voice selector, platform selector, back link |
| `components/conversations/MessageList.tsx` | Scrollable message list with auto-scroll |
| `components/conversations/MessageBubble.tsx` | Single message: user or assistant, with markdown rendering |
| `components/conversations/MessageInput.tsx` | Textarea + send button, Cmd+Enter shortcut, disabled during streaming |
| `components/conversations/SourcePanel.tsx` | Right pane (Explore): categorized sources with retrieval method badges |
| `components/conversations/DraftPreview.tsx` | Right pane (Draft): rendered draft content, platform/title display |

### Custom Hook

| File | Purpose |
|------|---------|
| `hooks/useChatStream.ts` | SSE streaming hook — sends messages, parses events, manages streaming state |

---

## Component Contracts

### `useChatStream` — The Critical Hook

This is the most important integration piece. It manages the SSE connection to POST /api/chat.

**Interface:**

```typescript
interface UseChatStreamReturn {
  sendMessage: (input: SendMessageInput) => void;
  isStreaming: boolean;
  streamingText: string;           // accumulates during streaming, cleared on next send
  retrievedSources: RetrievedSource[];  // from 'sources' event (Explore mode)
  lastDraft: ExtractedDraft | null;     // from 'done' event (Draft mode)
  error: string | null;
}
```

**Behavior contract:**
1. `sendMessage()` POSTs to `/api/chat` with the SendMessageInput body
2. Sets `isStreaming = true`
3. Parses SSE events from the response stream:
   - `sources` → stores in `retrievedSources`
   - `text` → appends to `streamingText`
   - `done` → sets `isStreaming = false`, stores `lastDraft`, calls `onComplete` callback
   - `error` → sets `error`, sets `isStreaming = false`
4. The hook does NOT manage message history — the parent component does that

**`onComplete` callback:** The hook should accept an `onComplete(messageId, draft)` callback that ChatInterface uses to:
- Append the completed assistant message to local state
- Re-fetch conversation data if needed
- Update draft preview

### `ChatInterface` — Main Orchestrator

**Props:**

```typescript
interface ChatInterfaceProps {
  conversation: Conversation;
  initialMessages: Message[];
}
```

**State it manages:**
- `messages: Message[]` — local message list (initialized from `initialMessages`, appended as messages arrive)
- Current mode (`conversation.mode` initially, can change via header toggle)
- Current platform (`conversation.platform` initially, can change via header selector)
- Current voice mode (`'personal'` default)
- `retrievedSources` from last Explore response
- `lastDraft` from last Draft response

**Send flow:**
1. User types message → hits send
2. Immediately append user message to local `messages` state (optimistic)
3. Call `sendMessage()` from `useChatStream`
4. While streaming: show `streamingText` as a "typing" assistant message
5. On `done`: append final assistant message to local state, clear streaming state
6. On `error`: show error, remove optimistic user message or show retry

### `ConversationHeader`

**Controls:**
- **Mode toggle:** Explore / Draft — two-segment toggle or dropdown. When switching to Draft, prompt for platform if not already set.
- **Voice selector:** Personal / Compound — simple dropdown. Default: Personal.
- **Platform selector:** Only visible in Draft mode. LinkedIn / Twitter / Long-form / Short-form. Required.
- **Back link:** Navigate to bucket detail (if `conversation.bucket_id`) or conversations list.
- **Title display:** Conversation title (auto-generated or "New Conversation"). Click to edit (PATCH conversation).

**When mode changes (Explore → Draft):**
1. If no platform set → show platform selection (can be inline dropdown or small modal)
2. PATCH /api/conversations/[id] with `{ mode: 'draft', platform }`
3. Update local state — next message sent with `mode: 'draft'`

**When mode changes (Draft → Explore):**
1. PATCH /api/conversations/[id] with `{ mode: 'explore' }`
2. Update local state

### `SourcePanel`

**Props:** `sources: RetrievedSource[]`

**Display:**
- Group by `retrieval_method`: Pinned (user-selected), Bucket, Semantic
- Each source shows: content preview, source_type badge, bucket_name (if cross-bucket), similarity score (if semantic)
- Empty state: "Send a message to see relevant sources"
- Sources update on every Explore message (per-turn re-retrieval)

### `DraftPreview`

**Props:** `draft: ExtractedDraft | null`

**Display:**
- Shows the latest extracted draft: title, platform badge, rendered markdown content
- "Copy to clipboard" button
- Empty state: "Draft will appear here when Sonnet writes one"
- Note: "Save to Drafts" button deferred to Task 10

### `MessageBubble`

**Display:**
- User messages: right-aligned or left-aligned with distinct background (follow existing Specter design: dark card bg)
- Assistant messages: left-aligned, with markdown rendering
- **In Draft mode:** assistant messages may contain `<draft>` tags in raw content. The chat thread should show the conversational text only (strip draft tags for display). The draft content renders in DraftPreview.
- Use `stripDraftTags()` from `lib/claude/parse.ts` for display

### `MessageInput`

**Behavior:**
- Auto-growing textarea (not fixed height)
- Send on Cmd+Enter (Mac) or Ctrl+Enter
- Disabled while `isStreaming` is true (show loading indicator)
- Placeholder text changes by mode: "Explore an angle..." vs "What should we draft?"

---

## Layout Specification

```
┌─────────────────────────────────────────────────────────────────────┐
│ ConversationHeader                                                   │
│ [← Back] [Title] ·····  [Explore | Draft] · [Voice ▼] · [Platform ▼]│
├──────────────────────────────────────┬──────────────────────────────┤
│ Chat Thread (left pane)              │ Context Panel (right pane)    │
│                                      │                              │
│ [User message]                       │ Explore: SourcePanel         │
│ [Assistant message]                  │   - Pinned sources           │
│ [User message]                       │   - Bucket sources           │
│ [Streaming response...]              │   - Semantic matches         │
│                                      │                              │
│                                      │ Draft: DraftPreview          │
│                                      │   - Platform badge           │
│                                      │   - Draft title              │
│                                      │   - Rendered markdown        │
│                                      │   - [Copy]                   │
├──────────────────────────────────────┤                              │
│ [MessageInput _______________] [Send]│                              │
└──────────────────────────────────────┴──────────────────────────────┘
```

**Responsive behavior:**
- Desktop: side-by-side split pane (chat ~60%, context ~40%)
- Mobile: stack vertically or hide context panel behind a toggle/tab
- Chat thread scrolls independently, auto-scrolls to bottom on new messages

---

## Conversation List Page (`/conversations`)

Replace the stub with a proper list view. Follow the patterns established by `BucketListView.tsx`.

**Features:**
- "New Conversation" button → opens NewConversationModal
- Conversation cards showing: title (or "Untitled"), mode badge (Explore/Draft), platform badge (if Draft), bucket name (or "Freestanding"), last updated time
- Optional filters: by mode (All/Explore/Draft), by bucket
- Empty state: "No conversations yet. Start one to begin exploring and drafting."
- Click card → navigate to `/conversations/[id]`

### `NewConversationModal`

Based on the UX doc's conversation creation flow:

**Fields:**
1. **Mode:** Explore (default) or Draft — card selection
2. **Bucket:** Dropdown of user's buckets + "Freestanding" option (null bucket_id)
3. **Voice:** Personal (default) or Compound — simple toggle
4. **Platform:** Only shown when Draft selected — required. LinkedIn/Twitter/Long-form/Short-form cards.
5. **"Search all sources" checkbox:** Maps to `includeAllBuckets` (default: checked)

**On submit:** POST /api/conversations → navigate to `/conversations/[id]`

---

## SSE Parsing Guide

The `useChatStream` hook needs to parse Server-Sent Events from a `fetch()` response. Here's the protocol:

**Request:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(input),
});
```

**Parsing:** Read the response body as a stream. Each SSE message is `data: {JSON}\n\n`. Parse by:
1. Get a `ReadableStream` reader from `response.body`
2. Decode chunks with `TextDecoder`
3. Split on `\n\n` to get individual events
4. Strip `data: ` prefix, parse JSON
5. Route by `event.type` ('sources' | 'text' | 'done' | 'error')

**Edge case:** Text chunks from the stream may split mid-event (a chunk might end in the middle of a JSON object). Buffer incomplete events and only parse when you have a complete `data: {...}\n\n` sequence.

---

## What This Task Does NOT Do

- **NOT API routes** — all endpoints exist (Task 8c). Do not modify `app/api/` files.
- **NOT draft versioning or "Save to Drafts" button** — that's Task 10. DraftPreview is display-only + copy.
- **NOT inbox source selection (checkboxes)** — deferred. The `manualSourceIds` param exists but the inbox checkbox UI is V2.
- **NOT markdown editor for drafts** — DraftPreview is read-only rendered markdown. Editable draft is Task 10.
- **NOT conversation search** — V2.
- **NOT conversation deletion** — V2. (Can add later via dropdown menu in list.)

---

## Existing Code to Build On

| File | What's There |
|------|-------------|
| `components/layout/AppShell.tsx` | Layout shell — wraps pages with Sidebar + TopBar |
| `components/buckets/BucketDetailView.tsx` | Has `handleStartConversation()` — creates conversation + navigates. Update this to open NewConversationModal instead of directly creating. |
| `components/ui/*` | 14 shadcn/ui components available: button, input, label, tabs, textarea, separator, card, switch, select, dialog, dropdown-menu, badge, popover, alert-dialog |
| `lib/types.ts` | `Conversation`, `Message`, `SendMessageInput`, `Platform`, `ConversationMode`, `PLATFORM_CONFIG` |
| `lib/claude/parse.ts` | `stripDraftTags(response)` — use in MessageBubble to display conversational text only |
| `lib/claude/prompts.ts` | `RetrievedSource` type — used in SourcePanel props |

---

## Acceptance Criteria

**Conversation list (`/conversations`):**
- [ ] Shows all user's conversations ordered by most recent
- [ ] Each card shows title, mode badge, platform (if Draft), bucket name, last updated
- [ ] "New Conversation" button opens creation modal
- [ ] Mode/bucket filters work
- [ ] Click card navigates to `/conversations/[id]`
- [ ] Empty state when no conversations

**New conversation modal:**
- [ ] Mode selection: Explore (default) / Draft
- [ ] Bucket selector with "Freestanding" option
- [ ] Voice: Personal (default) / Compound
- [ ] Platform selector (shown only in Draft mode, required)
- [ ] "Search all sources" checkbox (includeAllBuckets)
- [ ] Creates conversation via POST /api/conversations → navigates to chat

**Chat interface (`/conversations/[id]`):**
- [ ] Loads conversation + messages on page load (GET /api/conversations/[id])
- [ ] Displays message history with distinct user/assistant styling
- [ ] User can type and send messages (Cmd+Enter shortcut)
- [ ] Input disabled during streaming
- [ ] Claude's response streams in real-time (text appears character by character)
- [ ] Auto-scrolls to bottom on new messages
- [ ] Streaming assistant message shows as "in progress" (typing indicator or partial text)
- [ ] After stream completes: message appended to history
- [ ] Error handling: shows error message, allows retry

**Mode switching:**
- [ ] Header shows current mode (Explore/Draft)
- [ ] Toggle switches mode — PATCH /api/conversations/[id]
- [ ] Switching to Draft prompts for platform if not set
- [ ] Right pane updates: SourcePanel (Explore) or DraftPreview (Draft)
- [ ] Next message sent with the new mode

**Source panel (Explore mode):**
- [ ] Shows sources from last Explore response, grouped by retrieval_method
- [ ] Each source shows: content preview, type badge, bucket name, similarity score (if semantic)
- [ ] Updates on every Explore message (per-turn re-retrieval)
- [ ] Empty state when no sources or no messages sent yet

**Draft preview (Draft mode):**
- [ ] Shows latest extracted draft (title, platform, content as rendered markdown)
- [ ] "Copy to clipboard" button
- [ ] Updates when new draft is received in streaming response
- [ ] Empty state when no draft yet

**Message display:**
- [ ] Assistant messages in Draft mode: strip `<draft>` tags for chat display (use `stripDraftTags()`)
- [ ] Draft content shown in DraftPreview panel, not inline in chat

**Voice and platform:**
- [ ] Voice selector in header: Personal / Compound
- [ ] Platform selector in header: visible in Draft mode only
- [ ] Selections are sent with each chat request (voiceMode, platform params)

**Conversation persistence:**
- [ ] User can leave and return — messages reload from API
- [ ] Title auto-generated after first exchange (server-side, just displays it)
- [ ] Title is editable (click to edit → PATCH conversation)

**Infrastructure:**
- [ ] `useChatStream` hook handles SSE parsing correctly (including buffered/split chunks)
- [ ] No TypeScript errors, no lint errors
- [ ] Follows existing patterns: AppShell wrapper, shadcn/ui components, Specter design tokens
- [ ] Responsive: works on desktop (split pane) and mobile (stacked or tabbed)

---

## Reference Files

Read these before starting:

| File | What to look for |
|------|-----------------|
| `builder-agent-guide.md` | Builder autonomy vs contracts — read first |
| `claude-code-agent-instructions.md` | Coding conventions, design tokens, file patterns |
| `docs/ux-improvements-conversation-flow.md` | Detailed UX patterns for mode selection, voice selection, platform selection, source visibility, draft persistence |
| `components/buckets/BucketDetailView.tsx` | Existing "Start Conversation" flow — update to use modal |
| `components/buckets/BucketListView.tsx` | Pattern reference for list views (grid layout, empty states, filters) |
| `components/inbox/InboxView.tsx` | Pattern reference for list views |
| `components/settings/SettingsPanel.tsx` | Pattern reference for tabbed UI, form controls |
| `lib/types.ts` | All types: Conversation, Message, SendMessageInput, Platform, ConversationMode, PLATFORM_CONFIG |
| `lib/claude/parse.ts` | `stripDraftTags()` — import for MessageBubble display |
| `lib/claude/prompts.ts` | `RetrievedSource` type — import for SourcePanel props |
| `app/api/chat/route.ts` | SSE event format reference (read the streaming section) |
| `app/api/conversations/route.ts` | List + create conversation endpoints |
| `app/api/conversations/[id]/route.ts` | Get + update conversation endpoints |
