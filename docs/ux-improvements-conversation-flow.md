# UX Improvements — Conversation Flow Design

**Status:** Proposed patterns for Tasks 8a/8b/9 (Explore Mode + Draft Mode + Conversation UI)
**Date:** 2026-02-07
**Context:** Identified critical UX gaps during pre-Task 8 product review

---

## Executive Summary

The PRD defines the two-mode conversation system (Explore + Draft) but leaves several critical UX questions unanswered:
1. How do users start freestanding conversations?
2. When/where do users select mode (Explore vs Draft)?
3. How do users choose voice profiles?
4. When is platform selected (LinkedIn, Twitter, etc.)?

This document proposes specific UX patterns with reasoning. These patterns are designed to:
- **Minimize cognitive load** — smart defaults, progressive disclosure
- **Match user intent** — mode-first thinking aligns with how users approach synthesis vs writing
- **Enable flexibility** — support both structured and explorational workflows
- **Preserve context** — Explore → Draft transition carries full conversation history

---

## Critical Gap #1: Freestanding Conversation Entry Points

### The Problem

**Current state:**
- Bucket detail view has "Start Conversation" button (bucket-scoped conversations work)
- No UI for starting conversations NOT tied to a bucket
- Sidebar links to `/conversations` but it's just a stub

**User scenarios:**
1. **Cross-bucket synthesis**: "I want to write about AI regulation, pulling from sources across 3 different buckets"
2. **Immediate synthesis from inbox**: "I have 3 inbox sources I want to brainstorm about right now, without organizing them first"
3. **Blank slate exploration**: "I want to start a conversation without any specific bucket in mind"

### Proposed Pattern: Dual Entry Points + Smart Context

#### Entry Point A: Primary — Conversations Page

**Location:** `/conversations`

**UI:**
```
┌─────────────────────────────────────────────┐
│ Conversations                               │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │  + New Conversation                     │ │ ← Primary CTA, top of page
│ └─────────────────────────────────────────┘ │
│                                             │
│ Filter: [All] [Explore] [Draft] [By Bucket▼]│
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ AI ROI Measurement → Draft              │ │
│ │ Bucket: Business AI • Updated 2h ago    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Jevons Paradox Synthesis → Explore      │ │
│ │ Freestanding • Updated 1d ago           │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Behavior:**
- Clicking "+ New Conversation" opens conversation creation modal (see Gap #2)
- Conversations list shows both bucket-scoped and freestanding conversations
- Filter by mode (Explore/Draft), bucket, or show all
- "Freestanding" badge for conversations not tied to a bucket

**Why this works:**
- Natural home for "all my conversations" (both bucket-scoped and freestanding)
- Prominent CTA makes freestanding conversations a first-class feature
- Filters help users find conversations by context (bucket vs mode vs recency)

#### Entry Point B: Contextual — Inbox Source Selection

**Location:** `/inbox`

**UI:**
```
┌─────────────────────────────────────────────┐
│ Inbox (23)                    [+ Capture]   │
│                                             │
│ 💡 Select sources to start a conversation   │ ← Hint appears when hovering checkboxes
│                                             │
│ ☑ AI regulation memo from yesterday        │
│ ☑ PE firm interview notes                  │
│ ☑ Tweet thread about compliance             │
│ ☐ Random thought about coffee               │
│                                             │
│ [Start Conversation (3 sources)] [Clear]   │ ← Action bar appears when 2+ selected
└─────────────────────────────────────────────┘
```

**Behavior:**
- Checkboxes appear on hover/long-press (mobile)
- When 2+ sources selected, action bar slides up from bottom
- "Start Conversation" opens modal with these sources pre-selected
- In the conversation, these sources are prioritized in context (alongside semantic search results)

**Why this works:**
- **Low friction**: Users can synthesize immediately without creating buckets first
- **Intent capture**: Checkbox selection signals "I want to focus on THESE specific sources"
- **Complements semantic search**: Manual selection + auto semantic search = best of both worlds
- **Solves organizational paralysis**: Don't need to decide "which bucket?" before starting to think

#### Entry Point C: From Bucket Detail (Already Exists)

**Location:** `/buckets/[id]`

**Current UI:** "Start Conversation" button in bucket header

**Enhancement:**
- Keep existing button
- When clicked, pre-fill bucket in modal (user can change to freestanding if desired)
- Default to bucket-scoped context (`include_all_buckets: false`)

**Why this works:**
- Already built and intuitive
- Bucket context is clear and scoped
- Users can override to freestanding if they realize they need cross-bucket synthesis

---

## Critical Gap #2: Mode Selection UI

### The Problem

**PRD requirement:**
> "Two explicit modes (user selects, no auto-detection): Explore Mode (Opus) and Draft Mode (Sonnet)"

**Unclear:**
- When does the user make this choice?
- Can they switch modes mid-conversation?
- How is the current mode visually indicated?

**User mental model:**
- **"I want to brainstorm"** = Explore Mode (find angles, connect dots, synthesize)
- **"I want to write"** = Draft Mode (produce platform-specific content)

### Proposed Pattern: Mode-First Conversation Start + In-Conversation Switching

#### Modal on "+ New Conversation"

**UI:**
```
┌────────────────────────────────────────────────┐
│  Start a Conversation                          │
│                                                │
│  Choose how you want to work:                  │
│                                                │
│  ┌──────────────────────┐ ┌─────────────────┐ │
│  │  🔍 Explore Mode     │ │  ✍️ Draft Mode  │ │
│  │                      │ │                 │ │
│  │  Brainstorm angles,  │ │  Write content  │ │
│  │  find connections,   │ │  for a specific │ │
│  │  synthesize ideas    │ │  platform       │ │
│  │                      │ │                 │ │
│  │  Uses: Claude Opus   │ │  Uses: Sonnet   │ │
│  └──────────────────────┘ └─────────────────┘ │
│      [Selected]              [Select]         │
│                                                │
│  Voice: [Abhay (You) ▼]                        │
│  Bucket: [Freestanding ▼]                      │
│  Context: ☑ Search all sources                 │
│                                                │
│  [Cancel]                    [Start Explore]   │
└────────────────────────────────────────────────┘
```

**Behavior:**
- Mode selection is PRIMARY choice (top of modal)
- Cards explain what each mode does + which model it uses
- Button text updates based on selection: "Start Explore" or "Start Draft"
- If Draft is selected, platform selection is required (see Gap #4)

**Why mode-first:**
- **Matches user intent**: Users know "I want to brainstorm" or "I want to write" before starting
- **Sets expectations**: Different models (Opus vs Sonnet) → different behaviors
- **Clarifies workflow**: Explore is research/synthesis, Draft is production

#### In-Conversation Mode Indicator + Switcher

**Header UI:**
```
┌────────────────────────────────────────────────┐
│  [🔍 Explore Mode ▼]  •  Abhay  •  All Sources │ ← Persistent header
│  └─ Switch to Draft Mode                       │
│     (when dropdown clicked)                    │
│                                                │
│  Chat Pane                   │ Context Pane    │
│  ────────────────────────────│─────────────────│
│  You: I want to write about  │ 📚 Sources (12) │
│  PE firms measuring AI ROI   │ - AI ROI memo   │
│  wrong. Help me find an      │ - Jevons para...│
│  angle.                      │ - PE interview  │
│                              │                 │
│  Claude: Based on your       │ 💡 Tip          │
│  sources, I see 3 angles...  │ When ready to   │
│                              │ write, switch   │
│  [Switch to Draft Mode] ─────┤ to Draft Mode   │
└────────────────────────────────────────────────┘
```

**Mode Switch Behavior:**

**Explore → Draft:**
1. User clicks "Switch to Draft Mode" (button in header or prompt in context pane)
2. Platform selection modal appears (see Gap #4)
3. Same conversation ID continues — Draft receives full Explore conversation as context
4. Header updates to: `[✍️ Draft Mode ▼] • LinkedIn • Abhay`
5. Draft pane activates on right side (empty initially)
6. System prompt regenerates with Draft mode + platform rules

**Draft → Explore:**
1. Less common, but available via header dropdown
2. "Return to Explore Mode" option
3. Useful if user wants to refine the angle mid-draft
4. Draft pane remains visible but inactive

**Why this works:**
- **Same conversation**: PRD specifies Draft mode gets full Explore context — continuity is preserved
- **Progressive disclosure**: Explore first, Draft when ready (matches creative workflow)
- **Visual clarity**: Header always shows current mode, voice, context scope
- **Smooth transition**: "Switch to Draft" is a natural next step, not a disruptive mode change
- **Reversible**: Can go back to Explore if needed

---

## Critical Gap #3: Voice Profile Selection

### The Problem

**Three voice profiles:**
1. Abhay (Personal)
2. Srikar (Personal)
3. Compound (Shared company voice)

**Unclear:**
- Which voice is used by default?
- Can you switch mid-conversation?
- How do you know which voice is active?

**User scenarios:**
- Abhay writes personal LinkedIn post → uses Abhay voice
- Srikar writes company blog post → uses Compound voice
- Mid-conversation switch: "Actually, rewrite this in Compound voice instead"

### Proposed Pattern: Smart Default + Visible Override

#### Default Behavior

**Rule:**
- Logged in as **Abhay** → defaults to "Abhay (Personal)"
- Logged in as **Srikar** → defaults to "Srikar (Personal)"
- User can override at conversation start or mid-conversation

**Rationale:**
- 80% case: You write in your own voice
- 20% case: You write in Compound voice or impersonate the other person's style
- Smart default eliminates a decision for the common case

#### Voice Selection in Modal

**UI:**
```
┌────────────────────────────────────────────────┐
│  Start a Conversation                          │
│                                                │
│  Mode: [🔍 Explore Mode]                       │
│                                                │
│  Voice: [Abhay (You) ▼]                        │
│         └─ Abhay (Personal) ✓                  │
│            Srikar (Personal)                   │
│            Compound (Shared)                   │
│                                                │
│  💡 You can change voice mid-conversation      │
│                                                │
│  Bucket: [Freestanding ▼]                      │
│  Context: ☑ Search all sources                 │
│                                                │
│  [Cancel]                    [Start Explore]   │
└────────────────────────────────────────────────┘
```

**Behavior:**
- Dropdown shows all 3 voices
- Logged-in user's voice is selected by default and labeled "(You)"
- Hint text clarifies you can switch later

#### In-Conversation Voice Switcher

**Header UI:**
```
┌────────────────────────────────────────────────┐
│  [🔍 Explore]  •  [Abhay ▼]  •  All Sources    │
│                    └─ Abhay (Personal) ✓       │
│                       Srikar (Personal)        │
│                       Compound (Shared)        │
│                                                │
│  Chat Pane                                     │
│  ──────────────────────────────────────────────│
│  You: Now rewrite this in Compound voice       │ ← Conversational switch
│                                                │
│  Claude: [Rewrites in Compound voice]          │
│                                                │
│  [OR: Click dropdown to switch voice via UI]   │
└────────────────────────────────────────────────┘
```

**Voice Switching Mechanisms:**

**Option A: Conversational (Natural Language)**
- User: "Now rewrite this in Compound voice"
- Claude responds to the instruction in the new voice
- System prompt remains unchanged (Claude just follows instruction)

**Option B: UI-Driven (Explicit Control)**
- User clicks voice dropdown → selects new voice
- System prompt regenerates with new voice profile rules
- Next Claude response uses new voice by default

**Both are supported** — users can choose their preferred method

**Why this works:**
- **Zero friction for default case**: Your voice is pre-selected
- **Easy override**: One click to switch to Compound or other user's voice
- **Dual control**: Conversational ("write in X voice") or UI-driven (dropdown) — user preference
- **Always visible**: Header shows active voice, no mystery about what rules are in effect
- **Flexible workflow**: Can switch mid-conversation for A/B testing voice styles

---

## Critical Gap #4: Platform Selection Timing

### The Problem

**Platforms:** LinkedIn, Twitter/X, Long-form, Short-form

**Unclear:**
- When does the user choose platform?
- Does Explore Mode need a platform?
- Can you generate multiple platform variants in one conversation?

**User scenarios:**
1. **Explore-first workflow**: Brainstorm the angle first, THEN decide platform
2. **Platform-first workflow**: "I need a LinkedIn post about X" (skip Explore, go straight to Draft)
3. **Multi-platform repurposing**: Draft LinkedIn → "Now adapt for Twitter" → "Now for long-form"

### Proposed Pattern: Optional in Explore, Required in Draft, Multi-Platform Variants

#### Platform in Explore Mode: Not Set (Optional)

**Conversation creation modal when Explore Mode selected:**
```
┌────────────────────────────────────────────────┐
│  Start a Conversation                          │
│                                                │
│  Mode: [🔍 Explore Mode]                       │
│  Voice: [Abhay ▼]                              │
│  Platform: [Not set]  ← Grayed out, non-editable│
│                                                │
│  💡 Platform is optional in Explore mode.      │
│     Set it when you switch to Draft.           │
│                                                │
│  [Cancel]                    [Start Explore]   │
└────────────────────────────────────────────────┘
```

**Rationale:**
- **Explore is platform-agnostic**: You're finding angles, not writing for a specific format
- **Defers decision**: User doesn't need to commit to LinkedIn vs Twitter while brainstorming
- **Prevents premature constraint**: Platform rules (1300 chars, thread format) don't apply during synthesis

#### Platform in Draft Mode: Required

**When user clicks "Switch to Draft Mode":**
```
┌────────────────────────────────────────────────┐
│  Switch to Draft Mode                          │
│                                                │
│  Select platform for this draft:               │
│                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ LinkedIn │ │ Twitter  │ │Long-form │       │
│  │          │ │          │ │          │       │
│  │ 1300 chr │ │ Thread   │ │ 2-4k wds │       │
│  │ Hook 1st │ │ 280 each │ │ Sections │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐                                  │
│  │Short-form│                                  │
│  │ 500-1k   │                                  │
│  │ 1 thesis │                                  │
│  └──────────┘                                  │
│                                                │
│  [Cancel]              [Start Draft Mode]      │
└────────────────────────────────────────────────┘
```

**Behavior:**
- Platform selection is REQUIRED before entering Draft mode
- Cards show platform constraints (character limits, format rules)
- Clicking a platform card selects it (visual highlight)
- "Start Draft Mode" button activates only after platform selected

**Rationale:**
- **Platform rules matter**: 1300 char LinkedIn post ≠ Twitter thread ≠ 2-4k word long-form
- **System prompt construction**: Draft mode system prompt includes platform-specific voice rules
- **Sets user expectations**: "I'm writing a LinkedIn post" frames the task clearly

#### Direct-to-Draft Workflow (Skip Explore)

**Conversation creation modal when Draft Mode selected:**
```
┌────────────────────────────────────────────────┐
│  Start a Conversation                          │
│                                                │
│  Mode: [✍️ Draft Mode]                         │
│  Voice: [Abhay ▼]                              │
│  Platform: [LinkedIn ▼]  ← Required, editable  │
│            └─ LinkedIn ✓                       │
│               Twitter                          │
│               Long-form                        │
│               Short-form                       │
│                                                │
│  [Cancel]                      [Start Draft]   │
└────────────────────────────────────────────────┘
```

**Use case:**
- User knows exactly what they want: "I need a LinkedIn post about AI ROI"
- Skips Explore, goes straight to Draft
- Platform pre-selected in modal

**Why support this:**
- **Not everyone needs synthesis**: Sometimes you just need to write
- **Faster workflow**: One less mode transition for simple tasks
- **Still has context**: Semantic search still pulls relevant sources

#### Multi-Platform Variants in Same Conversation

**Scenario:** User drafts LinkedIn post, then says "Now adapt for Twitter"

**Conversation UI after first draft:**
```
┌────────────────────────────────────────────────┐
│  [✍️ Draft]  •  LinkedIn  •  Abhay             │
│                                                │
│  Chat Pane                   │ Draft Pane      │
│  ────────────────────────────│─────────────────│
│  You: Now adapt this for     │ 📝 LinkedIn (v2)│
│  Twitter                     │ [Copy] [Save]   │
│                              │                 │
│  Claude: Here's the Twitter  │ The PE firms    │
│  thread version...           │ are measuring...│
│                              │                 │
│                              │ 📋 Variants     │
│                              │ • LinkedIn ✓    │
│                              │ • Twitter (new) │
│                              │                 │
│  [Platform: LinkedIn ▼] ─────┤ [Switch]        │
│    └─ LinkedIn ✓             │                 │
│       Twitter (switch)       │                 │
└────────────────────────────────────────────────┘
```

**Behavior:**
1. User types: "Now adapt this for Twitter"
2. Claude generates Twitter thread version
3. Draft pane updates to show Twitter draft
4. Header platform updates to "Twitter"
5. "Variants" section shows both LinkedIn and Twitter drafts
6. User can click between variants to view/edit each one
7. Each variant auto-saves as a separate `draft` row in database

**Database Structure for Variants:**
```sql
drafts table:
- id (unique for each variant)
- conversation_id (same for all variants from this conversation)
- platform (linkedin, twitter, longform, shortform)
- version (v1, v2, v3 for iterative edits on same platform)
- content
- status (draft, ready, published)
- created_at
- updated_at

Example:
conversation_123 generates:
- draft_1: conversation_123, platform: linkedin, version: v1
- draft_2: conversation_123, platform: linkedin, version: v2 (after "make it punchier")
- draft_3: conversation_123, platform: twitter, version: v1 (after "adapt for twitter")
- draft_4: conversation_123, platform: longform, version: v1 (after "expand to long-form")
```

**Variants UI in Draft Pane:**
```
📋 Variants
├─ LinkedIn (2 versions)
│  ├─ v1 (saved)
│  └─ v2 (current) ✓
├─ Twitter (1 version)
│  └─ v1 (saved)
└─ Long-form (1 version)
   └─ v1 (saved)

[Switch Platform ▼]
```

**Why this works:**
- **Single conversation for repurposing**: Matches user mental model ("write this in multiple formats")
- **Full context carry-over**: Each platform variant has the same Explore conversation context
- **Easy comparison**: User can switch between LinkedIn and Twitter versions to see differences
- **Version tracking**: Multiple iterations on same platform (LinkedIn v1 → v2 → v3)
- **Linked in database**: `conversation_id` links all variants together
- **Clean drafts list**: In `/drafts`, user can filter by conversation or platform

---

## Additional UX Patterns

### Source Visibility During Conversation

**Context Pane UI:**
```
┌────────────────────────────────────────────────┐
│  📚 Sources in Context (15)                    │
│  [⚫ All sources] [○ Current bucket only]      │
│                                                │
│  Manually Selected (3):                        │
│  ✓ AI ROI memo from yesterday                 │
│  ✓ PE firm interview notes                    │
│  ✓ Tweet thread about compliance               │
│                                                │
│  Auto-Retrieved (12):                          │
│  • Jevons paradox article (87% match)         │
│  • SaaS pricing note (82% match)              │
│  • AI regulation podcast (78% match)          │
│  ...                                           │
│                                                │
│  [+ Add more sources]                          │
└────────────────────────────────────────────────┘
```

**Behavior:**
- Shows which sources are in context
- Separates manually-selected (from inbox checkboxes) vs semantic-search-retrieved
- Semantic matches show similarity score
- User can add/remove sources manually
- Toggle switches between "all sources" and "current bucket only"

**Why this works:**
- **Transparency**: User sees what Claude is looking at
- **Control**: Can add/remove sources if semantic search misses or over-retrieves
- **Trust**: Similarity scores show why each source was pulled
- **Feedback loop**: User learns what the semantic search considers "relevant"

### Draft Persistence Strategy

**Problem:** When does a draft get saved to the `drafts` table?

**Proposed: Auto-Save + Manual Promotion**

**Behavior:**
1. **Auto-save in conversation context**: Every time Claude generates/updates a draft, it's stored in conversation state (ephemeral)
2. **Manual "Save Draft" promotion**: User clicks "Save" → draft is written to `drafts` table with `status = 'draft'`
3. **Prevents clutter**: Drafts list only shows explicitly saved drafts, not every iteration
4. **Prevents data loss**: Conversation state persists, so even unsaved drafts are recoverable if user returns to conversation

**UI:**
```
┌────────────────────────────────────────────────┐
│  Draft Pane                                    │
│  ────────────────────────────────────────────  │
│  📝 LinkedIn (v3)                              │
│  [Copy] [Save to Drafts]  ← Manual save       │
│                                                │
│  (draft content...)                            │
│                                                │
│  💡 This draft is auto-saved in this           │
│     conversation. Click "Save to Drafts"       │
│     to add it to your drafts list.             │
└────────────────────────────────────────────────┘
```

**Why this works:**
- **No work lost**: Auto-save in conversation context prevents accidental loss
- **Clean drafts list**: Only promoted drafts show up in `/drafts`
- **Clear intent**: "Save to Drafts" signals "I'm happy with this, promote it"
- **Reversible**: User can always return to conversation to retrieve earlier versions

### Conversation List View

**`/conversations` page UI:**
```
┌─────────────────────────────────────────────────┐
│  Conversations                 [+ New]          │
│                                                 │
│  Filter: [All ▼] [Mode: All ▼] [Bucket: All ▼] │
│  Sort: [Updated ▼]                              │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ AI ROI Measurement                        │ │
│  │ Draft Mode • LinkedIn • 2 drafts saved    │ │
│  │ Bucket: Business AI • Updated 2h ago      │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ Jevons Paradox Synthesis                  │ │
│  │ Explore Mode • No drafts yet              │ │
│  │ Freestanding • Updated 1d ago             │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ SaaS Build vs Buy                         │ │
│  │ Draft Mode • Twitter + LinkedIn           │ │
│  │ Bucket: SaaS Economics • Updated 3d ago   │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Features:**
- Filter by mode (Explore/Draft), bucket (including "Freestanding"), status
- Sort by updated time, created time, or bucket
- Show mode, platform (if Draft), draft count, bucket association
- Click card to open conversation

---

## Database Schema Additions

To support these UX patterns, add the following to the schema:

```sql
-- Add to conversations table
ALTER TABLE conversations
  ADD COLUMN mode text CHECK (mode IN ('explore', 'draft')) DEFAULT 'explore',
  ADD COLUMN voice_profile text CHECK (voice_profile IN ('abhay', 'srikar', 'compound')),
  ADD COLUMN platform text CHECK (platform IN ('linkedin', 'twitter', 'longform', 'shortform'));

-- Track which sources are manually selected vs auto-retrieved
CREATE TABLE conversation_sources (
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  manually_selected boolean DEFAULT false, -- true if user checkbox-selected
  similarity_score float, -- for semantic search results
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, source_id)
);

-- Add version tracking to drafts (for LinkedIn v1, v2, v3)
ALTER TABLE drafts
  ADD COLUMN version int DEFAULT 1;

-- Index for finding all variants from same conversation
CREATE INDEX idx_drafts_conversation_platform
  ON drafts(conversation_id, platform, version DESC);
```

---

## Implementation Priority for Tasks 8a/8b/9

### Task 8a: Explore Mode (Sonnet agent)
**Must have:**
- [ ] Conversation creation modal (mode/voice/bucket/context selection)
- [ ] Split-pane UI (chat pane + context pane)
- [ ] Semantic search integration (pull top-k sources based on conversation topic)
- [ ] Source visibility panel (show which sources are in context)
- [ ] "Switch to Draft Mode" trigger button
- [ ] Voice profile injection into system prompt

**Can defer:**
- Manual source add/remove (V2)
- Source similarity scores UI (V2)
- Conversation search (V2)

### Task 8b: Draft Mode (Sonnet agent)
**Must have:**
- [ ] Platform selection modal (when switching from Explore or starting in Draft)
- [ ] Draft pane with live updates (right side of split-pane)
- [ ] Platform-specific system prompt construction
- [ ] Auto-save draft in conversation context
- [ ] "Save to Drafts" manual promotion
- [ ] Platform switcher (conversational: "now adapt for Twitter")

**Can defer:**
- Variants UI with version history (V2 — for now just show current draft)
- Side-by-side variant comparison (V2)
- Draft status workflow UI (V2 — default to `status = 'draft'`)

### Task 8c: Chat Router (Sonnet agent)
**Must have:**
- [ ] System prompt construction (mode + voice + platform + sources)
- [ ] Anthropic API integration with streaming
- [ ] Draft extraction from Claude responses (parse markdown code blocks)
- [ ] Message persistence to database
- [ ] Error handling (API key missing, rate limits, etc.)

### Task 9: Conversation UI (Sonnet agent)
**Must have:**
- [ ] `/conversations` list view with filters (mode, bucket)
- [ ] Conversation header (mode/voice/platform/bucket indicators)
- [ ] In-conversation mode switcher (Explore ↔ Draft)
- [ ] Voice switcher dropdown in header
- [ ] Source selection from inbox (checkboxes + "Start Conversation" action)
- [ ] Freestanding conversation support (bucket_id = null)

**Can defer:**
- Conversation search (V2)
- Bulk actions (archive, delete multiple conversations) (V2)
- Keyboard shortcuts (V2)

---

## Open Questions for Product Owner

1. **Voice switching mid-conversation**: Should conversational switching ("write in Compound voice") UPDATE the system prompt permanently, or just apply to that one response? (Recommendation: Just that response — UI dropdown does permanent switch)

2. **Freestanding → Bucket association**: Should users be able to retroactively move a freestanding conversation to a bucket? (Recommendation: Yes, add "Move to bucket" in conversation settings)

3. **Platform switching in Draft mode**: When user says "now adapt for Twitter", should the header platform dropdown auto-update to Twitter? (Recommendation: Yes, for consistency)

4. **Draft list clutter**: If a user generates 20 iterations in one conversation, should all 20 show up in `/drafts` or only the manually saved ones? (Recommendation: Only manually saved — see "Draft Persistence Strategy" above)

5. **Source selection limit**: Should there be a max number of sources in context? (E.g., top 20 semantic matches + unlimited manual selections) (Recommendation: Yes, cap at 30 total to prevent token limit issues)

6. **Conversation titles**: Should conversations auto-generate titles from first message, or require manual titling? (Recommendation: Auto-generate from first user message, editable via click-to-edit in header)

---

## Conclusion

These UX patterns solve the four critical gaps while maintaining:
- **Simplicity**: Smart defaults minimize decisions
- **Flexibility**: Power users can override everything
- **Clarity**: Current mode/voice/platform always visible
- **Workflow continuity**: Explore → Draft transition is smooth and preserves context

The patterns are designed to be **implementable in V1** with clear deferral points for V2 polish (search, keyboard shortcuts, bulk actions, etc.).

**Next step:** Agent building Tasks 8a/8b/9 can reference this doc for specific UI patterns and behaviors.
