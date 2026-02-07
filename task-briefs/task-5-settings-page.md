# Task 5 — Settings Page (API Key + Voice Profiles + Models)

**Status:** NOT STARTED
**Dependencies:** Task 4.5 (shadcn/ui setup — COMPLETE)
**Agent type:** Builder (Sonnet)
**Estimated effort:** 1 agent session

---

## Objective

Build the Settings page where users configure their Anthropic API key, edit personal and shared voice profiles, and select AI models for Explore/Draft modes. This is the configuration backbone — Tasks 8a/8b (AI modes) depend on the API key and voice profiles being saved here.

This is a **coding task.** You are building a full settings UI, API routes, and encryption utilities.

---

## Before You Start

Read these files in order:

1. `claude-code-agent-instructions.md` — Coding conventions, component patterns
2. `app/globals.css` — Design tokens (shadcn naming: `bg-primary` = Ghost Cyan, `bg-card` = Charcoal, etc.)
3. `lib/types.ts` — `Profile`, `VoiceConfig`, `CreateSourceInput`, `Platform` types
4. `lib/supabase/server.ts` — Server-side Supabase client pattern
5. `lib/supabase/client.ts` — Client-side Supabase client
6. `app/settings/page.tsx` — Existing stub (placeholder text)
7. `app/api/settings/api-key/route.ts` — Existing stub (501 not implemented)
8. `app/api/settings/voice-profile/route.ts` — Existing stub
9. `app/api/settings/voice-config/[id]/route.ts` — Existing stub
10. `lib/encryption.ts` — Existing stub (TODO comment)
11. `components/ui/button.tsx` — Existing shadcn Button (pattern reference)

---

## What's Already Done (Tasks 0–4.5)

- ✅ Next.js 14 with App Router, TypeScript, Tailwind v4
- ✅ Supabase live — `profiles` table (with `anthropic_api_key_encrypted`, `personal_voice_profile[]`, `explore_model`, `draft_model`), `voice_config` table (company + platform voice rules)
- ✅ Authentication flow (login/signup, middleware, session management)
- ✅ Layout shell (AppShell, Sidebar, TopBar) — Settings page routed at `/settings`
- ✅ shadcn/ui configured — Button component, `cn()` utility, `:root` + `@theme inline` token pattern
- ✅ Stub files exist for settings page, API routes, and encryption utility

You're replacing the stubs with full implementations.

---

## Context: Who Uses This

**Two users:** Abhay and Srikar at Compound.

**Voice profiles (3 total):**

| Profile | Type | Style |
|---------|------|-------|
| Abhay (personal) | Practitioner | How AI is actually implemented & adopted at companies. Grounded, specific, real-world examples. |
| Srikar (personal) | Strategic / Big Picture | Market dynamics, industry trends, where things are headed. Macro perspective. |
| Compound (company) | Forward-looking & Visionary | Bold predictions, future-focused. Where things are going, not where they've been. |

**Platform voice defaults:**
- LinkedIn: Professional, insight-driven
- Twitter/X: Punchy, provocative
- Long-form: Narrative depth, 2-4k words
- Short-form: Tight argument, 500-1k words

**Model defaults:** Opus for Explore, Sonnet for Draft.

---

## Step-by-Step Instructions

### Step 1: Install shadcn components

```bash
npx shadcn@latest add input label tabs textarea separator card switch select
```

This adds the UI primitives needed for the settings form. Each goes into `components/ui/`.

### Step 2: Implement `lib/encryption.ts`

Replace the stub with AES-256-GCM encryption. The encryption key comes from `ENCRYPTION_KEY` env var.

```typescript
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is required')
  // Key must be 32 bytes for AES-256
  return Buffer.from(key, 'hex')
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decrypt(ciphertext: string): string {
  const [ivB64, tagB64, encB64] = ciphertext.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const encrypted = Buffer.from(encB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
```

**Then generate an encryption key and add to `.env.local`:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the output as `ENCRYPTION_KEY=<hex>` in `.env.local`.

### Step 3: Implement API routes

#### 3a: `app/api/settings/api-key/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('anthropic_api_key_encrypted')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ hasKey: !!profile?.anthropic_api_key_encrypted })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apiKey } = await request.json()
  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 })
  }

  // Basic validation: Anthropic keys start with "sk-ant-"
  if (!apiKey.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'Invalid Anthropic API key format' }, { status: 400 })
  }

  const encrypted = encrypt(apiKey)
  const { error } = await supabase
    .from('profiles')
    .update({ anthropic_api_key_encrypted: encrypted })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('profiles')
    .update({ anthropic_api_key_encrypted: null })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

**NEVER return the decrypted key to the client.** Only return `{ hasKey: boolean }`.

#### 3b: `app/api/settings/voice-profile/route.ts`

This handles the user's personal voice profile (stored in `profiles.personal_voice_profile`).

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('personal_voice_profile')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rules: profile?.personal_voice_profile ?? [] })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rules } = await request.json()
  if (!Array.isArray(rules)) {
    return NextResponse.json({ error: 'rules must be an array of strings' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ personal_voice_profile: rules })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, rules })
}
```

#### 3c: `app/api/settings/voice-config/[id]/route.ts`

This handles shared voice configs (company + platform voice profiles from the `voice_config` table).

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
    .from('voice_config')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ voiceConfig: data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rules } = await request.json()
  if (!Array.isArray(rules)) {
    return NextResponse.json({ error: 'rules must be an array of strings' }, { status: 400 })
  }

  const { error } = await supabase
    .from('voice_config')
    .update({ rules, updated_by: user.id })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

#### 3d: Add `app/api/settings/models/route.ts` (NEW FILE)

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('explore_model, draft_model')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    exploreModel: profile?.explore_model,
    draftModel: profile?.draft_model,
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { exploreModel, draftModel } = await request.json()
  const updates: Record<string, string> = {}
  if (exploreModel) updates.explore_model = exploreModel
  if (draftModel) updates.draft_model = draftModel

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

### Step 4: Build the Settings page

Replace the stub `app/settings/page.tsx` with the full settings UI. The page has 3 sections, organized with Tabs:

1. **API Key** — Input, save, delete, status indicator
2. **Voice Profiles** — Personal voice + Company voice + Platform voices (sub-tabs)
3. **Models** — Explore model dropdown + Draft model dropdown

The settings page should be a **client component** (needs state, form handlers, fetch calls).

**Architecture:** Create the main page as a thin server component wrapper, with a client component `components/settings/SettingsPanel.tsx` that handles all the interactive UI.

#### 4a: Create `components/settings/SettingsPanel.tsx`

This is the main client component. It contains:

**API Key section:**
- A masked input field (type="password")
- Status badge: green "Connected" if key exists, gray "Not set" if not
- "Save Key" button (POST to `/api/settings/api-key`)
- "Remove Key" button with confirmation (DELETE to `/api/settings/api-key`)
- Validation: key must start with `sk-ant-`

**Voice Profile section (Tabs: Personal | Company | LinkedIn | Twitter/X | Long-form | Short-form):**
- Each tab shows a list of voice rules as editable text items
- Each rule is a single line of text (e.g., "Write like a practitioner, not a thought leader")
- "Add rule" button at the bottom — adds an empty input field
- Each rule has a delete (X) button to remove it
- "Save" button at the bottom — PATCHes the rules array
- Personal voice profile → PATCH `/api/settings/voice-profile`
- Company/platform voices → PATCH `/api/settings/voice-config/[id]`

**Model section:**
- Two dropdowns (Select components)
- "Explore Model" — default `claude-opus-4-5-20250929`
- "Draft Model" — default `claude-sonnet-4-20250514`
- Available models list (hardcoded for V1):
  ```typescript
  const AVAILABLE_MODELS = [
    { value: 'claude-opus-4-5-20250929', label: 'Claude Opus 4.5 (Best quality)' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Fast & capable)' },
  ]
  ```
- "Save" button — PATCHes `/api/settings/models`

**State management:** Use `useState` for form state, `useEffect` to load current values on mount. Show loading skeletons while fetching. Show success/error toasts (use a simple inline status message — no toast library needed for V1).

**Layout guidelines:**
- Max width: `max-w-3xl` — settings shouldn't span full width
- Section spacing: `space-y-8` between major sections
- Use `bg-card` for section cards, `border border-border` for definition
- Use `rounded-lg` for cards
- Ghost Cyan (`text-primary`) for active tab indicators and save buttons
- `text-muted-foreground` for helper text and descriptions
- `text-destructive` for delete/remove actions

#### 4b: Update `app/settings/page.tsx`

```tsx
import AppShell from '@/components/layout/AppShell'
import SettingsPanel from '@/components/settings/SettingsPanel'

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <h1 className="mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Configure your AI models, API key, and voice profiles.
        </p>
        <SettingsPanel />
      </div>
    </AppShell>
  )
}
```

### Step 5: Load voice configs on mount

When the SettingsPanel mounts, it needs to:

1. Fetch `GET /api/settings/api-key` → `{ hasKey: boolean }`
2. Fetch `GET /api/settings/voice-profile` → `{ rules: string[] }`
3. Fetch all voice configs from Supabase directly (client-side, RLS protects):
   ```typescript
   const { data: voiceConfigs } = await supabase
     .from('voice_config')
     .select('*')
     .order('type')
   ```
   This returns 5 rows: 1 company + 4 platforms. Display each in its own tab.
4. Fetch `GET /api/settings/models` → `{ exploreModel, draftModel }`

### Step 6: Test everything

```bash
pnpm dev
```

Verify:
1. Navigate to `/settings` — page loads without errors
2. API Key section: can enter key, save shows "Connected" badge, remove clears it
3. Voice Profile tabs: can add rules, edit inline, delete, save
4. Model dropdowns: show current values, can change and save
5. All data persists after page refresh
6. `pnpm tsc --noEmit` — zero TypeScript errors
7. No console errors

### Step 7: Commit

```bash
git add -A
git commit -m "Task 5: Settings page — API key encryption, voice profiles, model selection"
```

---

## Output

A fully functional Settings page with:
- AES-256-GCM API key encryption (never exposed to client)
- Personal voice profile editor (array of rules)
- Company voice profile editor (shared)
- Platform-specific voice profile editors (LinkedIn, Twitter/X, Long-form, Short-form)
- Model selection dropdowns (Explore + Draft)
- All 4 API routes implemented
- Encryption utility implemented

---

## Acceptance Criteria

- [ ] `lib/encryption.ts` implements AES-256-GCM encrypt/decrypt
- [ ] `ENCRYPTION_KEY` added to `.env.local`
- [ ] `POST /api/settings/api-key` encrypts and stores the key
- [ ] `GET /api/settings/api-key` returns `{ hasKey: boolean }` — never the key itself
- [ ] `DELETE /api/settings/api-key` removes the key
- [ ] API key validation: rejects keys not starting with `sk-ant-`
- [ ] `GET /api/settings/voice-profile` returns user's personal rules array
- [ ] `PATCH /api/settings/voice-profile` updates the rules array
- [ ] `PATCH /api/settings/voice-config/[id]` updates shared voice config rules
- [ ] `GET /api/settings/models` returns current explore_model and draft_model
- [ ] `PATCH /api/settings/models` updates model selections
- [ ] Settings page has 3 tabbed sections: API Key, Voice Profiles, Models
- [ ] API Key section shows "Connected" (green) or "Not set" (gray) status
- [ ] API Key input is masked (password type)
- [ ] Voice Profile section has sub-tabs: Personal, Company, LinkedIn, Twitter/X, Long-form, Short-form
- [ ] Each voice tab shows editable list of rule strings
- [ ] Can add, edit, and delete individual rules
- [ ] Model dropdowns default to Opus (Explore) and Sonnet (Draft)
- [ ] All changes persist to Supabase after save
- [ ] Loading states shown while fetching
- [ ] Success/error feedback shown after save actions
- [ ] Page styled with Specter design system (bg-card sections, Ghost Cyan accents, proper typography)
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] No console errors
- [ ] Responsive: works on mobile (stacked layout)
- [ ] Git committed with proper message

---

## Reference Files

| File | What to look at |
|------|----------------|
| `lib/types.ts` | `Profile`, `VoiceConfig` interfaces — your data shapes |
| `lib/supabase/server.ts` | Server client pattern for API routes |
| `lib/supabase/client.ts` | Client-side reads with RLS |
| `app/globals.css` | Design tokens — `bg-card`, `text-primary`, `text-muted-foreground`, etc. |
| `components/ui/button.tsx` | shadcn Button pattern — use for all buttons |
| `claude-code-agent-instructions.md` | Coding conventions, component size limits (~150 lines) |
| `technical-architecture-and-database-schema.md` | Full schema reference for profiles and voice_config tables |

---

## Notes for the Agent

- **shadcn components to install:** `input`, `label`, `tabs`, `textarea`, `separator`, `card`, `switch`, `select`. Run `npx shadcn@latest add <name>` for each.
- **Token naming:** Ghost Cyan = `bg-primary` / `text-primary`. Charcoal cards = `bg-card`. Muted text = `text-muted-foreground`. Hover gray = `bg-accent`.
- **No `.env.local` in git:** The encryption key goes in `.env.local` which is gitignored. Generate it with the node command in Step 2.
- **Tailwind v4:** Use CSS-based config. Don't create `tailwind.config.ts` changes.
- **Component size:** Keep SettingsPanel under 150 lines if possible. If it grows, extract sub-components (e.g., `ApiKeySection.tsx`, `VoiceProfileEditor.tsx`, `ModelSelector.tsx`) into `components/settings/`.
- **Voice config IDs:** The voice_config table is pre-seeded with 5 rows (1 company + 4 platforms). The builder should fetch all and identify them by `type` + `platform` fields, not hardcoded UUIDs.
- **`params` in Next.js 14:** Route params are a Promise in the latest App Router. Use `const { id } = await params` pattern.
- **Server vs. Client reads:** Voice configs can be read client-side via Supabase RLS. API key check and model selection go through API routes for security.
- **Don't over-engineer:** This is V1 for 2 users. Simple form state with `useState` is fine. No form libraries (react-hook-form, zod) needed.
