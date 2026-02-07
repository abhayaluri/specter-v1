# Task 8b — Draft Mode Implementation — COMPLETE ✓

**Agent:** Builder Agent (Task 8b)
**Date:** 2026-02-07
**Status:** All acceptance criteria met

---

## Files Created/Modified

### 1. `lib/claude/draft.ts` (NEW) — 162 lines
Draft mode engine with prompt builder and Sonnet streaming.

**Exports:**
- `interface DraftPromptInput` — Parameters for prompt builder
- `interface DraftResult` — Return type (Anthropic stream)
- `buildDraftPrompt(params)` — Constructs system prompt with voice rules
- `runDraftMode(params)` — Main engine function

**Key features:**
- ✅ Builds structured system prompt with company/personal/platform voice rules
- ✅ Passes ALL conversation history (Explore + Draft) to Sonnet
- ✅ Uses `profile.draft_model` with fallback to `'claude-sonnet-4-20250514'` (matches DB default)
- ✅ Streams response via Anthropic SDK
- ✅ Zero Supabase calls — pure function
- ✅ Supports empty voice arrays (Compound voice scenario)
- ✅ Platform-aware prompt construction

---

### 2. `lib/claude/parse.ts` (REPLACED STUB) — 77 lines
Draft extraction utilities for parsing `<draft>` tags from Claude responses.

**Exports:**
- `interface ExtractedDraft` — Parsed draft structure
- `extractDraft(response)` — Returns LAST draft (most recent revision)
- `extractAllDrafts(response)` — Returns ALL drafts in response
- `stripDraftTags(response)` — Returns conversational text only

**Key features:**
- ✅ Regex-based parsing with graceful error handling
- ✅ Returns `null` for responses without draft tags (no crash)
- ✅ Handles malformed tags, missing attributes, empty content
- ✅ Preserves markdown formatting inside drafts
- ✅ Extracts last draft when multiple present (revision scenario)

---

### 3. `lib/claude/client.ts` (EXISTING)
Already created by Task 8a — shared Anthropic client factory.

---

## Acceptance Criteria Verification

### System Prompt ✓
- [x] `buildDraftPrompt()` produces well-structured prompt with voice rules + platform rules + draft format instructions
- [x] Prompt includes company voice, personal voice, AND platform voice
- [x] Prompt instructs Sonnet to use `<draft platform="..." title="...">` tag format
- [x] Prompt tells Sonnet to produce COMPLETE drafts on revision (not diffs)
- [x] Prompt acknowledges prior Explore discussion may exist in conversation history

### Engine ✓
- [x] `runDraftMode()` passes ALL conversation messages (Explore + Draft) to Sonnet
- [x] Uses `profile.draft_model` (falls back to `claude-sonnet-4-20250514` — matches DB default)
- [x] Calls Sonnet with streaming via `client.messages.stream()`
- [x] Returns raw Anthropic MessageStream
- [x] Platform parameter controls which platform voice rules appear in the prompt
- [x] Works for both "Explore → Draft" transition and "Direct to Draft" (empty history)
- [x] Prior `<draft>` tags in conversation history are preserved (NOT stripped)

### Voice Flexibility ✓
- [x] Accepts `personalVoice`, `companyVoice`, and `platformVoice` as direct params (does NOT fetch voices internally)
- [x] Works correctly when personalVoice is empty (Compound voice scenario)
- [x] Zero Supabase calls — purely prompt construction + model call

### Draft Parsing ✓
- [x] `extractDraft()` returns the LAST `<draft>` tag match (most recent revision)
- [x] `extractDraft()` returns `null` for responses without draft tags (no crash)
- [x] `extractAllDrafts()` handles multiple draft tags in one response
- [x] `stripDraftTags()` removes all draft tags, returns conversational text only
- [x] Parser handles edge cases: malformed tags, missing attributes, empty content, markdown inside drafts

### Infrastructure ✓
- [x] Uses `createAnthropicClient()` from `lib/claude/client.ts` (created by 8a)
- [x] No TypeScript errors, no lint errors
- [x] Functions are clean — 8c can call `runDraftMode()` and get a stream back without knowing internals

---

## Code Quality Verification

### TypeScript Compilation
```bash
$ pnpm tsc --noEmit
✓ Zero errors
```

### ESLint
```bash
$ npx eslint lib/claude/draft.ts lib/claude/parse.ts
✓ Zero errors
```

---

## Integration Notes for Task 8c (Chat Router)

Task 8c will integrate this implementation as follows:

```typescript
import { runDraftMode } from '@/lib/claude/draft';
import { extractDraft } from '@/lib/claude/parse';

// In POST /api/chat when mode === 'draft':
const { stream } = await runDraftMode({
  userMessage,
  conversationHistory,
  platform,
  apiKey: decryptedApiKey,
  profile,
  personalVoice,   // 8c fetches based on conversation's voice setting
  companyVoice,     // 8c fetches from voice_config table
  platformVoice,    // 8c fetches from voice_config for selected platform
});

// Stream to client as SSE
// After stream completes:
const draft = extractDraft(fullResponse);
if (draft) {
  // Save draft_content on message row
}
```

---

## What This Implementation Does NOT Do

As specified in the task brief:
- ❌ NOT the /api/chat route (Task 8c)
- ❌ NOT message persistence (Task 8c)
- ❌ NOT SSE formatting (Task 8c)
- ❌ NOT auth verification or API key decryption (Task 8c)
- ❌ NOT voice profile fetching (Task 8c)
- ❌ NOT source retrieval (Task 8a)
- ❌ NOT the conversation UI (Task 9)
- ❌ NOT creating drafts table rows (Task 10 — manual "Save to Drafts")

---

## Testing Strategy

All functions are pure and easily testable:

**`buildDraftPrompt()`** — Pure function, no external dependencies
**`runDraftMode()`** — Only depends on Anthropic SDK (no Supabase)
**`extractDraft()`** — Pure function, regex-based
**`extractAllDrafts()`** — Pure function, regex-based
**`stripDraftTags()`** — Pure function, regex-based

Full pipeline testing will occur when Task 8c integrates both modes and Task 9 provides the UI.

---

## Edge Cases Handled

1. **Empty voice arrays** → Prompt says "No rules configured yet"
2. **Empty conversation history** → Works (Direct to Draft)
3. **Multiple `<draft>` tags** → `extractDraft()` returns last one
4. **No `<draft>` tags** → `extractDraft()` returns `null` (no crash)
5. **Malformed tags** → Regex skips them gracefully
6. **Markdown in draft content** → `[\s\S]*?` handles newlines/code blocks
7. **Prior `<draft>` tags in history** → Preserved (not stripped from messages)

---

## Ready for Task 8c Integration

Task 8b is complete and ready for integration. Task 8c can now:
1. Import `runDraftMode()` and call it when `mode === 'draft'`
2. Import `extractDraft()` to parse completed responses
3. Import `stripDraftTags()` to separate chat text from draft content

All functions have zero external dependencies except the Anthropic SDK, making them highly testable and reliable.
