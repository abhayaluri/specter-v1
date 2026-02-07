# Task 8c — Chat Router (API Routes + SSE Streaming)

**Status:** READY
**Dependencies:** Task 8a (Explore Mode) COMPLETE, Task 8b (Draft Mode) COMPLETE
**Agent type:** Builder

---

## Objective

Build the API routes that connect the frontend to the AI engines. This is the coordination layer — it handles auth, API key decryption, voice resolution, conversation management, message persistence, and SSE streaming. It calls `runExploreMode()` from 8a and `runDraftMode()` from 8b, converts their Anthropic `MessageStream` to SSE events for the client, and persists messages to the database.

This task produces **no AI logic** — all prompt construction, retrieval, and model calls are handled by the 8a/8b engines. 8c is pure plumbing.

---

## Architecture Context

```
Client sends: POST /api/chat { conversationId, message, mode, ... }
    ↓
1. Auth: verify Supabase session → reject if not logged in
    ↓
2. Fetch profile → decrypt API key (AES-256-GCM)
    ↓
3. Resolve voice rules:
   - Company voice: voice_config (type='company')
   - Personal voice: profile.personal_voice_profile (or [] if voiceMode='compound')
   - Platform voice: voice_config (type='platform', platform=X) [Draft only]
    ↓
4. Fetch conversation history (messages ordered by created_at asc)
    ↓
5. Route to engine based on mode:
   ├─ EXPLORE → runExploreMode()  → { stream: MessageStream, retrievedSources }
   └─ DRAFT   → runDraftMode()    → { stream: MessageStream }
    ↓
6. Convert Anthropic MessageStream to SSE:
   - [Explore only] First event: sources metadata
   - Text chunks: streamed as they arrive
   - Done event: final metadata (messageId, draft if applicable)
    ↓
7. After stream completes (inside the SSE handler):
   - Save user message to messages table
   - Save assistant message (content + draft_content if Draft mode)
   - Update conversation.updated_at + conversation.mode + conversation.platform
   - If first exchange: fire-and-forget generateConversationTitle()
```

---

## Imports from 8a and 8b (Exact Signatures)

These functions are ALREADY BUILT and COMMITTED. Use them exactly as documented here.

### From `lib/claude/explore.ts` (8a):

```typescript
import { runExploreMode, ExploreResult, RunExploreModeParams } from '@/lib/claude/explore';
```

```typescript
interface RunExploreModeParams {
  userMessage: string;
  conversationHistory: Message[];
  bucketId: string | null;
  includeAllBuckets: boolean;
  manualSourceIds: string[];
  apiKey: string;
  profile: Profile;
  personalVoice: string[];
  companyVoice: string[];
}

interface ExploreResult {
  stream: MessageStream;           // from @anthropic-ai/sdk/lib/MessageStream
  retrievedSources: RetrievedSource[];
}
```

### From `lib/claude/draft.ts` (8b):

```typescript
import { runDraftMode, DraftResult } from '@/lib/claude/draft';
```

```typescript
// runDraftMode accepts inline params (not a named interface)
function runDraftMode(params: {
  userMessage: string;
  conversationHistory: Message[];
  platform: Platform;
  apiKey: string;
  profile: Profile;
  personalVoice: string[];
  companyVoice: string[];
  platformVoice: string[];
}): Promise<DraftResult>

interface DraftResult {
  stream: MessageStream;
}
```

### From `lib/claude/parse.ts` (8b):

```typescript
import { extractDraft, ExtractedDraft } from '@/lib/claude/parse';
```

```typescript
function extractDraft(response: string): ExtractedDraft | null  // returns LAST match
interface ExtractedDraft { platform: string; title: string; content: string; }
```

### From `lib/claude/title.ts` (8a):

```typescript
import { generateConversationTitle } from '@/lib/claude/title';
```

```typescript
function generateConversationTitle(params: {
  firstUserMessage: string;
  firstAssistantResponse: string;  // first ~500 chars
  apiKey: string;
  conversationId: string;
}): Promise<void>   // fire-and-forget, never throws
```

### From `lib/claude/prompts.ts` (8a):

```typescript
import { RetrievedSource } from '@/lib/claude/prompts';
```

```typescript
interface RetrievedSource {
  id: string;
  content: string;          // ~200 char preview
  source_type: string;
  source_url: string | null;
  bucket_id: string | null;
  bucket_name: string | null;
  created_at: string;
  retrieval_method: 'pinned' | 'bucket' | 'semantic';
  similarity?: number;      // only for 'semantic'
}
```

### From existing code:

```typescript
import { decrypt } from '@/lib/encryption';
import { createClient } from '@/lib/supabase/server';
import { Profile, Message, Platform, ConversationMode } from '@/lib/types';
```

---

## SSE Event Format

All SSE events follow the format: `data: {JSON}\n\n`

### Explore Mode Events (in order):

```
1. data: {"type":"sources","sources":[...RetrievedSource[]]}
   ↑ Sent immediately before streaming starts. Contains categorized source metadata.
     Only sent if retrievedSources is non-empty.

2. data: {"type":"text","text":"chunk of text"}
   ↑ Repeated for every text chunk from Opus. Client appends to display.

3. data: {"type":"done","messageId":"uuid","draft":null}
   ↑ Sent after stream completes and messages are persisted.
     draft is always null in Explore mode.
```

### Draft Mode Events (in order):

```
1. data: {"type":"text","text":"chunk of text"}
   ↑ Repeated for every text chunk from Sonnet. Client appends to display.

2. data: {"type":"done","messageId":"uuid","draft":{"platform":"linkedin","title":"...","content":"..."}}
   ↑ Sent after stream completes. draft is ExtractedDraft or null.
     Client uses this to populate the draft pane.
```

### Error Event (any mode):

```
data: {"type":"error","error":"Human-readable error message"}
```

---

## Files to Create/Modify

### Codebase Conventions (MUST follow)

Before writing any code, note these patterns used by ALL existing route handlers:

1. **Async params (Next.js 16):** Dynamic route segments use `{ params }: { params: Promise<{ id: string }> }` with `const { id } = await params`. Do NOT use synchronous params.
2. **Request type:** Use standard `Request` (not `NextRequest`). Prefix unused request params with underscore: `_request: Request`.
3. **Response type:** Use `NextResponse.json()` for JSON responses. Use raw `new Response()` only for the SSE streaming response.
4. **Auth pattern:** Every handler starts with `const supabase = await createClient()` → `supabase.auth.getUser()` → 401 if no user.
5. **Ownership checks:** Filter by `owner_id: user.id` when querying user-owned resources.

---

### 1. `app/api/chat/route.ts` — REPLACE STUB (the critical file)

Replace the current 501 stub with the full streaming chat handler.

**Method:** POST only

**Request body:**

```typescript
{
  conversationId: string;                    // required
  message: string;                           // required
  mode: 'explore' | 'draft';                // required
  bucketId?: string | null;                  // optional (null = freestanding)
  includeAllBuckets?: boolean;               // default true
  platform?: Platform;                       // required if mode === 'draft'
  manualSourceIds?: string[];                // optional, default []
  voiceMode?: 'personal' | 'compound';       // optional, default 'personal'
}
```

**Full implementation flow:**

**Step 1: Auth + validation**

```typescript
import { NextResponse } from 'next/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const body = await request.json();
const {
  conversationId,
  message,
  mode,
  bucketId = null,
  includeAllBuckets = true,
  platform,
  manualSourceIds = [],
  voiceMode = 'personal',
} = body;

// Validate required fields
if (!conversationId || !message || !mode) {
  return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
}
if (mode === 'draft' && !platform) {
  return NextResponse.json({ error: 'Platform required for Draft mode' }, { status: 400 });
}
```

**Step 2: Verify conversation ownership + fetch profile + decrypt API key**

```typescript
// Verify the conversation belongs to the authenticated user
const { data: conversation } = await supabase
  .from('conversations')
  .select('*')
  .eq('id', conversationId)
  .eq('owner_id', user.id)
  .single();

if (!conversation) {
  return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
}

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

if (!profile) {
  return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
}
if (!profile.anthropic_api_key_encrypted) {
  return NextResponse.json({ error: 'API key not configured. Go to Settings to add your Anthropic API key.' }, { status: 400 });
}

let apiKey: string;
try {
  apiKey = decrypt(profile.anthropic_api_key_encrypted);
} catch {
  return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 });
}
```

**Step 3: Resolve voice rules**

This is where 8c handles the voice selection logic. The UX doc specifies three voice modes:
- **Personal** (default): Uses the logged-in user's personal voice + company voice
- **Compound**: Uses empty personal voice + company voice (the company speaks, not the individual)

```typescript
// Company voice — always fetched
const { data: companyVoiceConfig } = await supabase
  .from('voice_config')
  .select('rules')
  .eq('type', 'company')
  .single();
const companyVoice: string[] = companyVoiceConfig?.rules || [];

// Personal voice — empty for Compound voice mode
const personalVoice: string[] = voiceMode === 'compound'
  ? []
  : (profile.personal_voice_profile || []);

// Platform voice — Draft mode only
let platformVoice: string[] = [];
if (mode === 'draft' && platform) {
  const { data: platformVoiceConfig } = await supabase
    .from('voice_config')
    .select('rules')
    .eq('type', 'platform')
    .eq('platform', platform)
    .single();
  platformVoice = platformVoiceConfig?.rules || [];
}
```

**Step 4: Fetch conversation history**

```typescript
const { data: existingMessages } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });

const conversationHistory: Message[] = existingMessages || [];
```

**Step 5: Route to engine**

```typescript
let engineStream: any;  // MessageStream from Anthropic SDK
let retrievedSources: RetrievedSource[] = [];

if (mode === 'explore') {
  const result = await runExploreMode({
    userMessage: message,
    conversationHistory,
    bucketId,
    includeAllBuckets,
    manualSourceIds,
    apiKey,
    profile: profile as Profile,
    personalVoice,
    companyVoice,
  });
  engineStream = result.stream;
  retrievedSources = result.retrievedSources;
} else {
  const result = await runDraftMode({
    userMessage: message,
    conversationHistory,
    platform: platform as Platform,
    apiKey,
    profile: profile as Profile,
    personalVoice,
    companyVoice,
    platformVoice,
  });
  engineStream = result.stream;
}
```

**Step 6: Stream as SSE**

Convert the Anthropic `MessageStream` to SSE using a `ReadableStream`. Use the async iterator pattern — iterate `for await (const event of stream)` and look for `content_block_delta` events with `text_delta` type.

```typescript
const encoder = new TextEncoder();

const readable = new ReadableStream({
  async start(controller) {
    try {
      // [Explore only] Send sources metadata as first event
      if (mode === 'explore' && retrievedSources.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources: retrievedSources })}\n\n`)
        );
      }

      // Stream text chunks from Anthropic
      let fullResponse = '';

      for await (const event of engineStream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const text = event.delta.text;
          fullResponse += text;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`)
          );
        }
      }

      // --- Stream complete. Now persist. ---

      // Save user message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
        });

      // Extract draft (Draft mode only)
      let extracted: ExtractedDraft | null = null;
      if (mode === 'draft') {
        extracted = extractDraft(fullResponse);
      }

      // Save assistant message
      const { data: assistantMsg } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullResponse,
          draft_content: extracted?.content || null,
        })
        .select('id')
        .single();

      // Update conversation metadata (mode, platform, updated_at)
      const conversationUpdate: Record<string, any> = {
        mode,
        updated_at: new Date().toISOString(),
      };
      if (platform) {
        conversationUpdate.platform = platform;
      }
      await supabase
        .from('conversations')
        .update(conversationUpdate)
        .eq('id', conversationId);

      // Title generation — fire-and-forget, only on first exchange
      if (conversationHistory.length === 0) {
        generateConversationTitle({
          firstUserMessage: message,
          firstAssistantResponse: fullResponse.slice(0, 500),
          apiKey,
          conversationId,
        }).catch(() => {});  // silently swallow errors
      }

      // Send done event with message ID + extracted draft
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'done',
          messageId: assistantMsg?.id || null,
          draft: extracted,
        })}\n\n`)
      );

      controller.close();
    } catch (error: any) {
      // Send error event to client
      const errorMessage = error?.message || 'An unexpected error occurred';
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
      );
      controller.close();
    }
  },
});

return new Response(readable, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

**Important streaming details:**
- The `MessageStream` from `client.messages.stream()` implements the async iterator protocol
- Iterate with `for await (const event of stream)` — look for `event.type === 'content_block_delta'` with `event.delta.type === 'text_delta'`
- Accumulate `fullResponse` from text deltas (used for persistence after stream completes)
- Do NOT call `stream.finalMessage()` after iterating — just use the accumulated `fullResponse`
- The `try/catch` wraps the entire streaming + persistence block — if any step fails, an error event is sent to the client

---

### 2. `app/api/conversations/route.ts` — ENHANCE EXISTING

The existing file has a partial POST and a 501 GET stub. Enhance both.

**GET — List user's conversations**

```typescript
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bucketId = searchParams.get('bucketId');
  const mode = searchParams.get('mode');

  let query = supabase
    .from('conversations')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  // Optional filters
  if (bucketId) {
    query = query.eq('bucket_id', bucketId);
  }
  if (mode) {
    query = query.eq('mode', mode);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversations: data || [] });
}
```

**POST — Create conversation (enhance existing)**

The existing POST hardcodes `mode: 'explore'`. Enhance to accept mode, platform, and include_all_buckets from the client.

```typescript
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    bucketId = null,
    mode = 'explore',
    platform = null,
    includeAllBuckets = true,
  } = body;

  // Platform required for Draft mode
  if (mode === 'draft' && !platform) {
    return NextResponse.json({ error: 'Platform required for Draft mode' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      bucket_id: bucketId,
      owner_id: user.id,
      mode,
      platform: platform || null,
      include_all_buckets: includeAllBuckets,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversation: data }, { status: 201 });
}
```

---

### 3. `app/api/conversations/[id]/route.ts` — REPLACE STUB

Replace the 501 stubs with GET and PATCH handlers.

**GET — Fetch conversation with messages**

Returns the conversation metadata plus all messages ordered by created_at. This is the main data load when the UI opens a conversation.

```typescript
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch conversation (ownership check via owner_id filter)
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Fetch messages
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({
    conversation,
    messages: messages || [],
  });
}
```

**PATCH — Update conversation**

Used for mode switching (Explore → Draft), platform changes, title editing.

**IMPORTANT:** The client sends camelCase field names, but Supabase uses snake_case column names. Map explicitly.

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Map camelCase client fields → snake_case DB columns
  const update: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) update.title = body.title;
  if (body.mode !== undefined) update.mode = body.mode;
  if (body.platform !== undefined) update.platform = body.platform;
  if (body.includeAllBuckets !== undefined) update.include_all_buckets = body.includeAllBuckets;
  if (body.bucketId !== undefined) update.bucket_id = body.bucketId;

  const { data, error } = await supabase
    .from('conversations')
    .update(update)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

  return NextResponse.json({ conversation: data });
}
```

---

### 4. `lib/types.ts` — ADD FIELDS TO SendMessageInput

Add `manualSourceIds` and `voiceMode` to the existing `SendMessageInput` type. These fields are used by the client when calling POST /api/chat.

```typescript
// BEFORE:
export interface SendMessageInput {
  conversationId: string;
  message: string;
  mode: ConversationMode;
  bucketId?: string;
  includeAllBuckets?: boolean;
  platform?: Platform;
}

// AFTER:
export interface SendMessageInput {
  conversationId: string;
  message: string;
  mode: ConversationMode;
  bucketId?: string;
  includeAllBuckets?: boolean;
  platform?: Platform;
  manualSourceIds?: string[];
  voiceMode?: 'personal' | 'compound';
}
```

---

## Error Handling Strategy

The chat route has two error zones — **pre-stream** (before SSE starts) and **in-stream** (during SSE).

### Pre-stream errors (return JSON with HTTP status code):

| Error | Response |
|-------|----------|
| Not authenticated | 401 `{ error: 'Unauthorized' }` |
| Missing required fields | 400 `{ error: 'Missing required fields' }` |
| Draft mode without platform | 400 `{ error: 'Platform required for Draft mode' }` |
| Profile not found | 404 `{ error: 'Profile not found' }` |
| API key not configured | 400 `{ error: 'API key not configured...' }` |
| API key decryption failed | 500 `{ error: 'Failed to decrypt API key' }` |

### In-stream errors (send SSE error event):

| Error | SSE Event |
|-------|-----------|
| Anthropic API error (invalid key, rate limit, etc.) | `{ type: 'error', error: 'message' }` |
| Engine throws (runExploreMode/runDraftMode) | `{ type: 'error', error: 'message' }` |
| Database error during persistence | `{ type: 'error', error: 'message' }` |

**Important:** Once the SSE stream has started (headers sent), you cannot change the HTTP status code. All errors during streaming must be sent as SSE error events, then close the stream.

---

## Voice Resolution Logic (Summary)

8c is responsible for determining WHICH voice rules to pass to the engines. The engines are agnostic — they just accept arrays of rules.

```
voiceMode = 'personal' (default):
  → personalVoice = profile.personal_voice_profile (user's own voice rules)
  → companyVoice  = voice_config WHERE type='company' → rules[]

voiceMode = 'compound':
  → personalVoice = []  (empty — no individual voice)
  → companyVoice  = voice_config WHERE type='company' → rules[]

Draft mode additionally:
  → platformVoice = voice_config WHERE type='platform' AND platform=X → rules[]
```

The `voiceMode` parameter comes from the client on each request. Task 9 (UI) will manage the voice selection dropdown in the conversation header and pass the appropriate value.

---

## Acceptance Criteria

**Chat route (`/api/chat`):**
- [ ] POST handler replaces 501 stub
- [ ] Auth: rejects unauthenticated requests with 401
- [ ] Validates required fields (conversationId, message, mode)
- [ ] Validates platform is present when mode is 'draft'
- [ ] Verifies conversation ownership (conversationId belongs to authenticated user) before proceeding
- [ ] Fetches profile, decrypts API key via `decrypt()`
- [ ] Resolves voice rules correctly: personal vs compound voiceMode
- [ ] Fetches platform voice for Draft mode
- [ ] Fetches conversation history ordered by created_at asc
- [ ] Routes to `runExploreMode()` for explore mode with correct params
- [ ] Routes to `runDraftMode()` for draft mode with correct params
- [ ] Streams Anthropic MessageStream as SSE events
- [ ] Sends `{ type: 'sources', ... }` event for Explore mode before text
- [ ] Sends `{ type: 'text', text }` events for each text chunk
- [ ] Accumulates full response text during streaming
- [ ] Saves user message to messages table after stream completes
- [ ] Saves assistant message with `draft_content` extracted via `extractDraft()` (Draft mode)
- [ ] Updates conversation.mode, conversation.platform, conversation.updated_at
- [ ] Fires `generateConversationTitle()` (fire-and-forget) on first exchange only
- [ ] Sends `{ type: 'done', messageId, draft }` event after persistence
- [ ] Catches streaming errors and sends `{ type: 'error', error }` event
- [ ] Returns proper SSE headers (Content-Type: text/event-stream, etc.)

**Conversations list (`/api/conversations`):**
- [ ] GET returns user's conversations ordered by updated_at desc
- [ ] GET supports optional `bucketId` and `mode` query params for filtering
- [ ] POST enhanced: accepts `mode`, `platform`, `includeAllBuckets` params
- [ ] POST validates platform required for draft mode
- [ ] Auth on both endpoints

**Conversation detail (`/api/conversations/[id]`):**
- [ ] GET returns conversation metadata + messages (ordered by created_at asc)
- [ ] GET validates ownership (owner_id matches authenticated user)
- [ ] PATCH maps camelCase client fields to snake_case DB columns correctly
- [ ] PATCH updates allowed fields (title, mode, platform, includeAllBuckets→include_all_buckets, bucketId→bucket_id)
- [ ] PATCH sets updated_at timestamp
- [ ] PATCH validates ownership
- [ ] Auth on both endpoints
- [ ] **All route handlers use async params pattern:** `{ params }: { params: Promise<{ id: string }> }` with `const { id } = await params`

**Types:**
- [ ] `SendMessageInput` updated with `manualSourceIds` and `voiceMode` fields

**Infrastructure:**
- [ ] No TypeScript errors, no lint errors
- [ ] All imports resolve correctly (8a/8b exports exist and match signatures above)
- [ ] Proper error handling: pre-stream errors return JSON, in-stream errors send SSE events

---

## What This Task Does NOT Do

- **NOT AI logic** — prompt construction, retrieval, and model calls are in 8a/8b
- **NOT the conversation UI** — that's Task 9 (React components, chat interface, mode switcher)
- **NOT the draft pane UI** — that's Task 9/10
- **NOT inbox source selection UI** — that's Task 9; this task accepts `manualSourceIds` as input
- **NOT voice selection UI** — that's Task 9; this task accepts `voiceMode` as input
- **NOT creating drafts table rows** — draft_content is saved on the message row; "Save to Drafts" is Task 10
- **NOT the conversation creation modal** — that's Task 9; this task provides the POST /api/conversations endpoint

---

## Reference Files

Read these before starting:

| File | What to look for |
|------|-----------------|
| `lib/claude/explore.ts` | `runExploreMode()` signature and return type — you call this |
| `lib/claude/draft.ts` | `runDraftMode()` signature and return type — you call this |
| `lib/claude/parse.ts` | `extractDraft()` signature — you call this after Draft stream completes |
| `lib/claude/title.ts` | `generateConversationTitle()` — you call this fire-and-forget |
| `lib/claude/prompts.ts` | `RetrievedSource` type — used in sources SSE event |
| `lib/claude/client.ts` | `createAnthropicClient()` — NOT called by 8c directly (engines handle this) |
| `lib/encryption.ts` | `decrypt()` — for API key decryption |
| `lib/supabase/server.ts` | `createClient()` — server-side Supabase client |
| `lib/types.ts` | All types: `Profile`, `Message`, `Platform`, `ConversationMode`, `SendMessageInput` |
| `technical-architecture-and-database-schema.md` lines 296-395 | POST /api/chat reference design |
| `docs/ux-improvements-conversation-flow.md` | Voice selection, platform selection, mode switching patterns |

---

## Testing Strategy

After implementation, the full pipeline can be tested end-to-end:

1. **Create conversation:** POST /api/conversations → get conversationId
2. **Send Explore message:** POST /api/chat with mode='explore' → verify SSE sources + text + done events
3. **Check persistence:** GET /api/conversations/[id] → verify user + assistant messages saved
4. **Check title:** After a few seconds, GET conversation → verify title was auto-generated
5. **Switch to Draft:** PATCH /api/conversations/[id] with mode='draft', platform='linkedin'
6. **Send Draft message:** POST /api/chat with mode='draft', platform='linkedin' → verify SSE text + done events with draft
7. **Check draft extraction:** GET conversation → verify assistant message has draft_content

**Quick smoke test via curl:**

```bash
# Create conversation
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"mode":"explore"}'

# Send message (SSE stream)
curl -N http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"<id>","message":"Help me find an angle on AI regulation","mode":"explore"}'
```

Note: These require an authenticated session cookie. Testing through the browser dev tools network tab may be easier.
