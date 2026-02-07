# Task 8b — Draft Mode (Writing + Voice + Platform)

**Status:** READY
**Dependencies:** Task 5 (voice profiles + API key) COMPLETE
**Agent type:** Builder
**Parallel with:** Task 8a (Explore Mode) — see "Parallel Execution Notes" at bottom

---

## Objective

Build the Draft mode engine: platform-specific content writing with voice profile enforcement, `<draft>` tag parsing, and streaming response. This produces clean, testable functions that Task 8c (Chat Router) will call from the `/api/chat` route.

Draft mode is where users write. Sonnet takes the full conversation context (including any prior Explore discussion), applies voice profiles and platform constraints, and produces polished content wrapped in `<draft>` tags. It does NOT do source retrieval (that's Explore mode's job).

---

## Architecture Context

```
User sends message in Draft mode
    ↓
[8c handles: auth, API key decryption, voice + platform voice fetching, passing params]
    ↓
1. Build Draft system prompt (voice + platform rules + draft format instructions)
    ↓
2. Pass ALL conversation messages to Sonnet (Explore + Draft history)
    ↓
3. Call Sonnet with streaming
    ↓
4. Return raw Anthropic stream
    ↓
[8c handles: SSE formatting, message persistence, draft extraction via parse.ts]
```

**Key decisions:**
- **No source retrieval.** Draft mode writes from conversation context. If you want source-grounded drafting, use Explore first. The Explore conversation (with source references) is already in the message history.
- **Platform required.** Platform must be set when entering Draft mode (enforced by the conversation creation modal in Task 9).
- **All messages passed.** Explore-era and Draft-era messages are both sent in the Anthropic messages array. The system prompt does NOT re-inject stringified conversation history — that would duplicate what's already in the messages. The system prompt focuses on rules and format.
- **Draft persistence: message-level.** When Sonnet produces a `<draft>` tag, 8c saves the extracted draft_content on the message row. Actual `drafts` table rows are created only when the user manually clicks "Save to Drafts" in the UI (Task 9/10). This keeps the drafts list clean.
- **Repurposing.** Same conversation, different platform → the `platform` parameter changes per request. Sonnet gets the new platform's voice rules and writes a new draft. Multiple platform variants live as separate messages in the same conversation.
- **Voice rules are passed in, not fetched internally.** 8c fetches the appropriate voice rules based on user selection and passes them directly. This supports the UX doc's voice selection feature (Abhay / Srikar / Compound). See "Voice Profile Design" section below.
- **Zero Supabase calls.** Draft mode is purely prompt construction + model call. All data fetching is handled by 8c. This makes 8b maximally focused and testable.

---

## Voice Profile Design

The UX doc (see `docs/ux-improvements-conversation-flow.md`) specifies that users can select voice at conversation start:
- **Abhay (Personal)** → personal voice = Abhay's rules, company voice = Compound rules
- **Srikar (Personal)** → personal voice = Srikar's rules, company voice = Compound rules
- **Compound (Shared)** → personal voice = empty, company voice = Compound rules

To support this, `runDraftMode()` accepts `personalVoice`, `companyVoice`, and `platformVoice` as direct parameters. **8c is responsible for:**
1. Determining which voice profile to use (from conversation settings or user selection)
2. Fetching the appropriate personal voice rules (or empty array for Compound voice)
3. Fetching the company voice rules from `voice_config` table
4. Fetching the platform voice rules from `voice_config` table
5. Passing all three to `runDraftMode()`

---

## Existing Code to Build On

| File | Status | What's There |
|------|--------|-------------|
| `lib/types.ts` | READY | All types: `Profile`, `VoiceConfig`, `Platform`, `Message`, `ConversationMode` |
| `lib/claude/client.ts` | CREATED BY 8a | `createAnthropicClient(apiKey)` — if 8a hasn't run yet, create this yourself (see 8a brief for contents) |
| `lib/claude/parse.ts` | STUB | Comment only: `// Draft extraction — implemented in Task 8` |
| `@anthropic-ai/sdk` | v0.73.0 | Installed in package.json |

**Database tables (read by 8c, not by 8b):**
- `voice_config` — company voice (type='company') + platform voices (type='platform')
- `profiles` — `personal_voice_profile` (string[]), `draft_model` (string)
- `messages` — `draft_content` column (stores extracted draft from assistant messages)

---

## Files to Create/Modify

### 1. `lib/claude/draft.ts` — Draft Mode Engine + Prompt Builder (NEW FILE)

This file contains both the prompt builder and the engine function. Kept separate from `prompts.ts` (which 8a owns) to enable parallel development — 8c can import from both files.

#### Types

```typescript
import { Platform, Message, Profile } from '@/lib/types';

export interface DraftPromptInput {
  userName: string;
  personalVoice: string[];
  companyVoice: string[];
  platformVoice: string[];
  platform: Platform;
}

export interface DraftResult {
  stream: AsyncIterable<any>;  // Anthropic MessageStream events
}
```

#### `buildDraftPrompt(params: DraftPromptInput): string`

The system prompt should follow this structure:

```
## Role
You are in DRAFT mode. Your job is to write compelling platform-specific content. Follow the voice profile and platform rules strictly.

## How You Work
- Write content based on the conversation so far. The conversation may include prior Explore-mode discussion where ideas, angles, and source material were discussed — build on that context.
- Follow the voice profile rules strictly — these define the writing style.
- When producing or updating a draft, ALWAYS wrap it in <draft> tags (see Draft Format below). This is how the application extracts your draft content.
- Be direct and collaborative — explain your creative choices briefly, and ask for feedback after presenting the draft.
- When the user asks for revisions, produce a complete updated draft (not just the changed parts). Always wrap the full updated draft in <draft> tags.
- When the user asks to adapt for a different platform, write a fresh draft following that platform's rules.

## Company Voice
{company voice rules, bulleted — or "No company voice rules configured yet."}

## {userName}'s Personal Voice
{personal voice rules, bulleted — or "No personal voice rules configured yet."}

## Platform: {platform}
{platform voice rules, bulleted}

## Draft Format
When you produce or update a draft, wrap it in these exact delimiters:

<draft platform="{platform}" title="{title}">
[Your draft content in markdown]
</draft>

Rules:
- ALWAYS include these delimiters when producing or updating draft content
- The platform attribute should match the current platform ({platform})
- The title should be a short, descriptive title for the draft
- Continue your conversational response OUTSIDE the delimiters
- You can include commentary before or after the draft explaining your choices or asking for feedback
- When revising, produce the COMPLETE updated draft, not just changes
```

**Important prompt details:**
- The prompt does NOT include conversation history or source material — those come through the messages array
- The prompt acknowledges that prior Explore discussion may exist ("conversation may include prior Explore-mode discussion")
- Platform voice rules come from the `platformVoice` parameter (8c fetches from `voice_config` table)
- Draft format instructions must be explicit — Sonnet needs clear guidance on the `<draft>` tag syntax

---

#### `runDraftMode(params): Promise<DraftResult>`

**Function signature:**

```typescript
export async function runDraftMode(params: {
  userMessage: string;
  conversationHistory: Message[];
  platform: Platform;
  apiKey: string;
  profile: Profile;          // for model selection + display name only
  personalVoice: string[];   // voice rules — 8c determines which voice to use
  companyVoice: string[];    // company voice rules — 8c fetches from voice_config
  platformVoice: string[];   // platform voice rules — 8c fetches from voice_config
}): Promise<DraftResult>
```

**Why voice rules are passed in:** Same rationale as 8a — supports the UX doc's voice selection feature. Also makes `runDraftMode()` a pure function with zero Supabase calls — maximally testable.

**Implementation steps:**

**Step 1: Build system prompt**

```typescript
const systemPrompt = buildDraftPrompt({
  userName: profile.display_name,
  personalVoice,   // passed in by 8c
  companyVoice,     // passed in by 8c
  platformVoice,    // passed in by 8c
  platform,
});
```

**Step 2: Build messages array**

Pass ALL conversation messages (Explore + Draft eras) plus the new user message:

```typescript
const messages = conversationHistory.map(msg => ({
  role: msg.role as 'user' | 'assistant',
  content: msg.content,
}));

// Append the new user message
messages.push({ role: 'user', content: userMessage });
```

**Why all messages?** When the user switches from Explore to Draft, the Explore conversation provides context — the angles discussed, sources referenced, ideas brainstormed. Sonnet benefits from seeing this full history. If it's a fresh Draft conversation (no Explore), the history is simply empty.

**Note on `<draft>` tags in history:** Prior assistant messages may contain `<draft>` tags from previous draft iterations. This is intentional — Sonnet can see what it previously wrote when the user asks for revisions. Do NOT strip tags from conversation history.

**Step 3: Call Sonnet with streaming**

```typescript
import { createAnthropicClient } from './client';

const client = createAnthropicClient(apiKey);
const stream = client.messages.stream({
  model: profile.draft_model || 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: systemPrompt,
  messages,
});
```

**Note on model fallback:** The fallback `claude-sonnet-4-20250514` matches the database default set in Task 2. Users can change their draft model in Settings (Task 5). If `profile.draft_model` is set, it takes priority.

**Step 4: Return stream**

```typescript
return { stream };
```

Draft mode returns just the stream — no source metadata (that's Explore mode's concern). 8c handles extracting draft content from the completed response and saving it.

---

### 2. `lib/claude/parse.ts` — Draft Extraction (REPLACE STUB)

This file is used by 8c to extract draft content from Claude's response after the stream completes.

#### Types

```typescript
export interface ExtractedDraft {
  platform: string;
  title: string;
  content: string;
}
```

#### `extractDraft(response: string): ExtractedDraft | null`

Parses the **last** `<draft>` tag from Claude's response. Returns the last match because when Sonnet produces multiple drafts in one response, the final one is the most recent revision.

```typescript
export function extractDraft(response: string): ExtractedDraft | null {
  const drafts = extractAllDrafts(response);
  return drafts.length > 0 ? drafts[drafts.length - 1] : null;
}
```

#### `extractAllDrafts(response: string): ExtractedDraft[]`

Extracts all `<draft>` tags from a response:

```typescript
export function extractAllDrafts(response: string): ExtractedDraft[] {
  const draftRegex = /<draft\s+platform="([^"]+)"\s+title="([^"]+)">\s*([\s\S]*?)\s*<\/draft>/g;
  const drafts: ExtractedDraft[] = [];
  let match;

  while ((match = draftRegex.exec(response)) !== null) {
    drafts.push({
      platform: match[1],
      title: match[2],
      content: match[3].trim(),
    });
  }

  return drafts;
}
```

**Edge cases to handle:**
- Response contains no `<draft>` tags → return `null` / empty array (normal — not every Draft response produces a draft, e.g., "what angle do you want?")
- Response contains multiple `<draft>` tags → `extractDraft()` returns the LAST one; `extractAllDrafts()` returns all
- Malformed tags (missing attributes) → skip that tag, don't crash
- Very long draft content → no truncation, return full content
- Draft content contains markdown (headers, code blocks, lists) → the `[\s\S]*?` regex handles this correctly

#### `stripDraftTags(response: string): string`

Returns the conversational portion of the response (everything outside `<draft>` tags):

```typescript
export function stripDraftTags(response: string): string {
  return response.replace(/<draft\s+[^>]*>[\s\S]*?<\/draft>/g, '').trim();
}
```

**Why this matters:** In the chat thread UI (Task 9), the user sees the conversational portion — Claude's commentary about the draft, questions about revisions, etc. The draft content itself renders in the separate draft pane. `stripDraftTags()` separates the two.

---

### 3. `lib/claude/client.ts` — Anthropic Client Helper (SHARED)

If 8a has already created this file, use it as-is. If running before 8a, create it:

```typescript
import Anthropic from '@anthropic-ai/sdk';

export function createAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}
```

---

## How Draft Persistence Works (8b + 8c + Task 9/10)

Understanding the full flow helps the builder make the right choices:

```
1. User sends message in Draft mode
       ↓
2. 8b: runDraftMode() → Sonnet streams response with <draft> tags
       ↓
3. 8c: Stream completes → collect full response text
       ↓
4. 8c: Call extractDraft(fullResponse) → get ExtractedDraft or null
       ↓
5. 8c: Save message to DB:
   - messages.content = fullResponse (the FULL response including <draft> tags)
   - messages.draft_content = extractedDraft.content (just the draft text, or null)
       ↓
6. 8c: Send SSE events to client:
   - Text chunks during streaming
   - Final event includes: { done: true, draft: ExtractedDraft | null }
       ↓
7. Task 9 UI: Shows conversational text (stripDraftTags) in chat thread
             Shows draft content in draft pane
             "Save to Drafts" button → creates row in drafts table (Task 10)
```

**8b's responsibility:** Steps 2 only (engine + parsing functions).
**8c's responsibility:** Steps 3-6 (persistence + SSE).
**Task 9/10's responsibility:** Step 7 (UI + manual draft promotion).

The key insight: `<draft>` tags in a response do NOT auto-create `drafts` table rows. They're extracted and stored on the message. The user decides when a draft is "worth saving" to the drafts list.

---

## Error Handling

`runDraftMode()` should handle these errors gracefully:

| Error | Handling |
|-------|----------|
| Anthropic API error (invalid key, rate limit) | Throw — let 8c handle and return appropriate HTTP error to client. |
| Empty conversation history (Direct to Draft, no Explore) | Normal — just send the user's message. Sonnet can draft from a single instruction. |
| Empty voice arrays | Normal — prompt says "No rules configured yet." Sonnet writes without style constraints. |

`extractDraft()` should never throw:

| Input | Output |
|-------|--------|
| Response with valid `<draft>` tags | Last `ExtractedDraft` object |
| Response with multiple `<draft>` tags | Last one (most recent revision) |
| Response with no `<draft>` tags | `null` |
| Response with malformed tags | `null` |
| Empty string | `null` |

---

## Acceptance Criteria

**System prompt:**
- [ ] `buildDraftPrompt()` produces well-structured prompt with voice rules + platform rules + draft format instructions
- [ ] Prompt includes company voice, personal voice, AND platform voice
- [ ] Prompt instructs Sonnet to use `<draft platform="..." title="...">` tag format
- [ ] Prompt tells Sonnet to produce COMPLETE drafts on revision (not diffs)
- [ ] Prompt acknowledges prior Explore discussion may exist in conversation history

**Engine:**
- [ ] `runDraftMode()` passes ALL conversation messages (Explore + Draft) to Sonnet
- [ ] Uses `profile.draft_model` (falls back to `claude-sonnet-4-20250514` — matches DB default)
- [ ] Calls Sonnet with streaming via `client.messages.stream()`
- [ ] Returns raw Anthropic MessageStream
- [ ] Platform parameter controls which platform voice rules appear in the prompt
- [ ] Works for both "Explore → Draft" transition and "Direct to Draft" (empty history)
- [ ] Prior `<draft>` tags in conversation history are preserved (NOT stripped)

**Voice flexibility:**
- [ ] Accepts `personalVoice`, `companyVoice`, and `platformVoice` as direct params (does NOT fetch voices internally)
- [ ] Works correctly when personalVoice is empty (Compound voice scenario)
- [ ] Zero Supabase calls — purely prompt construction + model call

**Draft parsing:**
- [ ] `extractDraft()` returns the LAST `<draft>` tag match (most recent revision)
- [ ] `extractDraft()` returns `null` for responses without draft tags (no crash)
- [ ] `extractAllDrafts()` handles multiple draft tags in one response
- [ ] `stripDraftTags()` removes all draft tags, returns conversational text only
- [ ] Parser handles edge cases: malformed tags, missing attributes, empty content, markdown inside drafts

**Infrastructure:**
- [ ] Uses `createAnthropicClient()` from `lib/claude/client.ts` (creates if 8a hasn't)
- [ ] No TypeScript errors, no lint errors
- [ ] Functions are clean — 8c can call `runDraftMode()` and get a stream back without knowing internals

---

## What This Task Does NOT Do

- **NOT the /api/chat route** — that's Task 8c (Chat Router)
- **NOT message persistence** — 8c saves messages + draft_content to DB
- **NOT SSE formatting** — 8c converts the Anthropic stream to SSE for the client
- **NOT auth verification or API key decryption** — 8c handles auth + passes decrypted key
- **NOT voice profile fetching** — 8c fetches voices based on user selection and passes rules as params
- **NOT source retrieval** — that's Task 8a (Explore Mode). Draft mode writes from conversation context.
- **NOT the conversation UI or draft pane** — that's Task 9/10
- **NOT creating drafts table rows** — that's manual "Save to Drafts" in Task 10. 8c only saves draft_content on the message row.

---

## Parallel Execution Notes (8a and 8b)

Tasks 8a and 8b can run in parallel. File ownership:

| File | Owner | Notes |
|------|-------|-------|
| `lib/claude/prompts.ts` | **8a** | 8a adds `buildExplorePrompt()` + shared types (`SourceForPrompt`, `RetrievedSource`) |
| `lib/claude/explore.ts` | **8a** | Explore mode engine |
| `lib/claude/title.ts` | **8a** | Auto-title generation (called by 8c for any mode) |
| `lib/claude/draft.ts` | **8b** | `buildDraftPrompt()` + `runDraftMode()` |
| `lib/claude/parse.ts` | **8b** | `extractDraft()`, `stripDraftTags()`, `extractAllDrafts()` |
| `lib/claude/client.ts` | **8a creates, 8b uses** | If 8b runs first, create it yourself (same content) |

No merge conflicts — each task owns distinct files.

---

## How 8c Coordinates 8a and 8b

For the builder's context, here's how 8c (Chat Router) will use the functions built by 8a and 8b:

```
POST /api/chat receives: { conversationId, message, mode, bucketId, includeAllBuckets, platform, manualSourceIds }
    ↓
8c: Verify auth → decrypt API key → fetch profile
    ↓
8c: Fetch voice rules based on conversation's voice setting:
    - Personal voice from profile (or empty for Compound voice)
    - Company voice from voice_config (type='company')
    - Platform voice from voice_config (type='platform', platform=X) [Draft only]
    ↓
8c: Fetch conversation history from messages table
    ↓
8c: Route based on mode:
    ├─ EXPLORE → runExploreMode({ ..., personalVoice, companyVoice })
    │            Returns: { stream, retrievedSources }
    │
    └─ DRAFT   → runDraftMode({ ..., personalVoice, companyVoice, platformVoice })
                 Returns: { stream }
    ↓
8c: Convert stream to SSE → send to client
    ↓
8c: After stream completes:
    - Save user message + assistant message to DB
    - If Draft mode: extractDraft() → save draft_content on message
    - If first exchange: generateConversationTitle() (fire-and-forget)
```

---

## Reference Files

Read these before starting:

| File | What to look for |
|------|-----------------|
| `technical-architecture-and-database-schema.md` lines 543-616 | `buildDraftPrompt` template + `extractDraft` parser |
| `technical-architecture-and-database-schema.md` lines 296-395 | POST /api/chat flow — understand how 8c will call your code |
| `docs/ux-improvements-conversation-flow.md` | Draft persistence strategy, platform selection, repurposing flow, voice selection |
| `lib/types.ts` | Type definitions — `Platform`, `Message`, `Profile`, `VoiceConfig` |
| `claude-code-agent-instructions.md` | Coding conventions, file patterns |

---

## Testing Strategy

Since this task produces library functions, testing happens when 8c integrates. However, ensure:

1. `extractDraft()`, `extractAllDrafts()`, and `stripDraftTags()` are pure functions — easily unit-testable without any API calls
2. Test these edge cases mentally or with inline comments:
   - Response with no draft tags
   - Response with draft tags but missing attributes
   - Response with multiple draft tags (extractDraft returns LAST, extractAllDrafts returns all)
   - Response where draft content contains markdown (headers, code blocks, lists)
   - Empty response string
3. `buildDraftPrompt()` is a pure function — can be tested with mock inputs
4. `runDraftMode()` has zero Supabase calls — only depends on Anthropic SDK

After 8c is complete, the full pipeline can be tested: send message in Draft mode → get streamed Sonnet response → extract draft → verify draft_content saved on message.
