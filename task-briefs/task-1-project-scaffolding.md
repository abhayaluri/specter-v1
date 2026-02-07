# Task 1 — Project Scaffolding

**Status:** NOT STARTED
**Dependencies:** Task 0 (design-system.md — COMPLETE)
**Agent type:** Builder
**Estimated effort:** 1 agent session

---

## Objective

Initialize the Next.js project with all dependencies, folder structure, Tailwind config (from design system), TypeScript types, font loading, and shared utilities. This is the skeleton every other builder agent builds on.

This is a **coding task.** You are creating a working project from scratch.

---

## Before You Start

Read these files in order:

1. `design-system.md` — Design tokens, Tailwind config, font loading strategy. **Section 7 has the ready-to-paste `tailwind.config.ts`. Section 8 has the font loading code.**
2. `claude-code-agent-instructions.md` — File & folder structure (lines 40-82), naming conventions, component patterns.
3. `technical-architecture-and-database-schema.md` — TypeScript types (lines 830-967), dependencies (lines 991-1015), environment variables (lines 971-987).

---

## Step-by-Step Instructions

### Step 1: Create the Next.js Project

Run from the project root directory (`/Users/abhay-ryze/Desktop/Cambrian/Cambrian Content Engine V1/`):

```bash
pnpm create next-app@latest app --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm
```

This creates a `app/` directory... but we actually want the project at the root. **Alternative approach:**

```bash
cd "/Users/abhay-ryze/Desktop/Cambrian/Cambrian Content Engine V1"
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm
```

If the directory isn't empty (it has markdown docs), you may need to scaffold in a temp directory and move files, or use `--no-git` and handle manually. The key settings:

- **TypeScript:** Yes
- **Tailwind CSS:** Yes
- **ESLint:** Yes
- **App Router:** Yes (not Pages Router)
- **`src/` directory:** No
- **Import alias:** `@/*`
- **Package manager:** pnpm

If `create-next-app` won't run in a non-empty directory, create it in a temp subdirectory and move the generated files to the project root. The markdown docs in the root are project planning docs and won't interfere with the Next.js app.

### Step 2: Install Additional Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk openai react-markdown clsx tailwind-merge
```

These are the exact versions from the architecture doc:
- `@supabase/supabase-js` — Supabase client
- `@supabase/ssr` — Supabase SSR utilities for Next.js
- `@anthropic-ai/sdk` — Claude API client
- `openai` — OpenAI SDK (for embeddings)
- `react-markdown` — Rendering markdown draft content
- `clsx` + `tailwind-merge` — Conditional class utility

### Step 3: Copy Font Files

Copy the Die Grotesk font files from the Cambrian website into the project:

```bash
mkdir -p public/fonts
cp "/Users/abhay-ryze/Desktop/Cambrian/cambrian website v1/assets/fonts/test-die-grotesk-a-regular.woff2" public/fonts/
cp "/Users/abhay-ryze/Desktop/Cambrian/cambrian website v1/assets/fonts/test-die-grotesk-vf-roman.woff2" public/fonts/
```

### Step 4: Configure Tailwind

Replace `tailwind.config.ts` with the config from `design-system.md` Section 7. Here it is for convenience:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#141414',
        surface: '#161616',
        'surface-hover': '#1E1E1E',
        border: '#2A2A2A',
        'border-light': '#333333',
        text: '#E8E6E3',
        'text-muted': '#8A8A8A',
        'text-dim': '#5A5A5A',
        accent: '#E8B931',
        'accent-dim': '#E8B93122',
        danger: '#D4594E',
        success: '#4A9B6F',
      },
      fontFamily: {
        sans: ['var(--font-grotesk-b)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['var(--font-grotesk-a)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-ibm-plex)', 'Monaco', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}

export default config
```

### Step 5: Set Up Root Layout with Font Loading

Replace `app/layout.tsx` with the font loading setup from `design-system.md` Section 8:

```tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// Die Grotesk A (display/headings)
const groteskA = localFont({
  src: '../public/fonts/test-die-grotesk-a-regular.woff2',
  variable: '--font-grotesk-a',
  display: 'swap',
  weight: '400',
})

// Die Grotesk B (body/UI text — variable font)
const groteskB = localFont({
  src: '../public/fonts/test-die-grotesk-vf-roman.woff2',
  variable: '--font-grotesk-b',
  display: 'swap',
  weight: '400',
})

// IBM Plex Mono (code/monospace)
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Cambrian Content Engine',
  description: 'Content creation tool for Compound / Cambrian Explorations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${groteskA.variable} ${groteskB.variable} ${ibmPlexMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### Step 6: Set Up Global CSS

Replace `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html,
  body {
    @apply bg-bg text-text;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    @apply bg-white text-bg;
  }
}
```

### Step 7: Create the `cn()` Utility

Create `lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Step 8: Create TypeScript Types

Create `lib/types.ts` with all types from the architecture doc. Copy these exactly:

```ts
// ============================================
// Database entity types
// ============================================

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  personal_voice_profile: string[];
  explore_model: string;
  draft_model: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceConfig {
  id: string;
  type: 'company' | 'platform';
  platform: 'linkedin' | 'twitter' | 'longform' | 'shortform' | null;
  rules: string[];
  updated_by: string | null;
  updated_at: string;
}

export interface Bucket {
  id: string;
  name: string;
  description: string | null;
  color: string;
  owner_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  source_count?: number;
  draft_count?: number;
}

export type SourceType = 'note' | 'link' | 'voice_memo' | 'podcast_note' | 'article_clip' | 'tweet';

export interface Source {
  id: string;
  bucket_id: string | null;
  owner_id: string;
  content: string;
  source_type: SourceType;
  source_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields
  bucket_name?: string;
  owner_name?: string;
}

export type Platform = 'linkedin' | 'twitter' | 'longform' | 'shortform';
export type DraftStatus = 'draft' | 'ready' | 'published';
export type ConversationMode = 'explore' | 'draft';

export interface Conversation {
  id: string;
  bucket_id: string | null;
  owner_id: string;
  title: string | null;
  include_all_buckets: boolean;
  platform: Platform | null;
  mode: ConversationMode;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  draft_content: string | null;
  created_at: string;
}

export interface Draft {
  id: string;
  conversation_id: string | null;
  bucket_id: string | null;
  owner_id: string;
  title: string;
  platform: Platform;
  status: DraftStatus;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface DraftVersion {
  id: string;
  draft_id: string;
  version: number;
  content: string;
  created_at: string;
}

// ============================================
// Input types for API calls
// ============================================

export interface CreateSourceInput {
  content: string;
  sourceType: SourceType;
  sourceUrl?: string;
  bucketId?: string;
}

export interface CreateBucketInput {
  name: string;
  description?: string;
  color?: string;
}

export interface SendMessageInput {
  conversationId: string;
  message: string;
  mode: ConversationMode;
  bucketId?: string;
  includeAllBuckets?: boolean;
  platform?: Platform;
}

// ============================================
// Display config constants
// ============================================

export const PLATFORM_CONFIG: Record<Platform, { label: string; icon: string; desc: string; color: string }> = {
  linkedin: { label: 'LinkedIn', icon: 'in', desc: 'Professional, insight-driven', color: '#0A66C2' },
  twitter: { label: 'Twitter / X', icon: '𝕏', desc: 'Punchy, provocative', color: '#1C1C1C' },
  longform: { label: 'Long-form', icon: '¶', desc: 'Narrative depth, 2-4k words', color: '#8B6914' },
  shortform: { label: 'Short-form', icon: '§', desc: 'Tight argument, 500-1k words', color: '#5B7553' },
};

export const BUCKET_COLORS = [
  '#E8B931', '#4A9EDE', '#D4594E', '#9B59B6',
  '#2ECC71', '#E67E22', '#1ABC9C', '#E74C3C',
  '#3498DB', '#F39C12',
];
```

### Step 9: Create the Folder Structure

Create all directories and placeholder files per the CLAUDE.md spec. Placeholder files should be minimal — just enough that the path exists and TypeScript is happy.

**Directories to create:**

```
app/
  login/
  inbox/
  buckets/
    [id]/
  conversations/
    [id]/
  drafts/
    [id]/
  settings/
  api/
    chat/
    sources/
    buckets/
    drafts/
    settings/
      api-key/
      voice-profile/
      voice-config/
        [id]/
    embed/
    conversations/
      [id]/
components/
  ui/
  chat/
  drafts/
  sources/
  buckets/
  layout/
lib/
  supabase/
  claude/
```

**Placeholder files to create** (minimal stubs — just enough that imports won't break):

```
app/login/page.tsx          → export default function LoginPage() { return <div>Login</div> }
app/inbox/page.tsx          → export default function InboxPage() { return <div>Inbox</div> }
app/buckets/page.tsx        → export default function BucketsPage() { return <div>Buckets</div> }
app/buckets/[id]/page.tsx   → export default function BucketDetailPage() { return <div>Bucket Detail</div> }
app/conversations/[id]/page.tsx → export default function ConversationPage() { return <div>Conversation</div> }
app/drafts/page.tsx         → export default function DraftsPage() { return <div>Drafts</div> }
app/drafts/[id]/page.tsx    → export default function DraftDetailPage() { return <div>Draft Detail</div> }
app/settings/page.tsx       → export default function SettingsPage() { return <div>Settings</div> }
```

**API route stubs** (return 501 Not Implemented):

```
app/api/chat/route.ts
app/api/sources/route.ts
app/api/buckets/route.ts
app/api/drafts/route.ts
app/api/settings/api-key/route.ts
app/api/settings/voice-profile/route.ts
app/api/settings/voice-config/[id]/route.ts
app/api/embed/route.ts
app/api/conversations/route.ts
app/api/conversations/[id]/route.ts
```

Each API stub:
```ts
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
```

**Lib stubs:**

```
lib/supabase/client.ts      → // Browser Supabase client — implemented in Task 3
lib/supabase/server.ts       → // Server Supabase client — implemented in Task 3
lib/claude/client.ts         → // Anthropic API client — implemented in Task 8
lib/claude/prompts.ts        → // Explore + Draft prompt builders — implemented in Task 8
lib/claude/parse.ts          → // Draft extraction — implemented in Task 8
lib/encryption.ts            → // AES-256-GCM encrypt/decrypt — implemented in Task 5
```

Each lib stub should export empty functions or `// TODO` comments — just enough that the file exists at the expected path.

### Step 10: Create `.env.local.example`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Encryption (for API key storage)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_SECRET=

# Embeddings
OPENAI_API_KEY=sk-...

# Optional: Default Anthropic key for development
# ANTHROPIC_API_KEY=sk-ant-...
```

### Step 11: Create a Dashboard Placeholder

Replace `app/page.tsx` with a simple dark-themed placeholder that confirms the design system is working:

```tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg p-12">
      <h1 className="font-display text-[32px] tracking-tight text-text mb-6">
        Cambrian Content Engine
      </h1>
      <p className="text-text-muted text-sm">
        Dashboard — coming soon
      </p>
      <div className="mt-8 p-6 bg-surface border border-border rounded-lg">
        <p className="text-text">
          If you can see this card with the correct dark theme, Die Grotesk font, and amber accent below, the design system is working.
        </p>
        <div className="mt-4 h-2 w-32 bg-accent rounded-full" />
      </div>
    </div>
  )
}
```

### Step 12: Verify Everything Works

```bash
pnpm dev
```

Open `http://localhost:3000` and verify:
- [ ] Page loads without errors
- [ ] Dark background (`#141414`)
- [ ] Die Grotesk A font on the heading (check with browser devtools)
- [ ] Die Grotesk B font on body text
- [ ] Surface card with border visible
- [ ] Amber accent bar visible
- [ ] No console errors

### Step 13: Initialize Git

```bash
git init
git add -A
git commit -m "Task 1: Project scaffolding — Next.js 14, Tailwind, types, design system, fonts"
```

**Important:** Make sure `.env.local` is in `.gitignore` (create-next-app should have set this up, but verify). The `.env.local.example` file IS committed.

---

## Output

A working Next.js 14 project at the project root with:
- All dependencies installed
- Tailwind configured with design system tokens
- Font loading working (Die Grotesk A/B + IBM Plex Mono)
- All TypeScript types defined
- Full folder structure with placeholder files
- `cn()` utility
- `.env.local.example`
- Git initialized with first commit

---

## Acceptance Criteria

- [ ] `pnpm dev` runs without errors
- [ ] Tailwind is working with custom theme tokens (dark bg, surface card, accent color visible)
- [ ] Die Grotesk A renders on display text (verify in browser devtools → Computed → font-family)
- [ ] Die Grotesk B renders on body text
- [ ] IBM Plex Mono is available via `font-mono` class
- [ ] All TypeScript types compile without errors
- [ ] Folder structure matches the CLAUDE.md spec (all directories and placeholder files exist)
- [ ] `cn()` utility works (`import { cn } from '@/lib/utils'` resolves)
- [ ] `.env.local.example` exists with all required env var placeholders
- [ ] Git initialized with clean first commit
- [ ] No TypeScript errors (`pnpm tsc --noEmit` passes)

---

## Reference Files

| File | What to look at |
|------|----------------|
| `design-system.md` | Section 7 (Tailwind config), Section 8 (font loading) |
| `claude-code-agent-instructions.md` | File & folder structure (lines 40-82), naming conventions |
| `technical-architecture-and-database-schema.md` | TypeScript types (lines 830-967), dependencies (lines 991-1015), env vars (lines 971-987) |

---

## Notes for the Agent

- **The project root already contains markdown files** (PRD, architecture doc, etc.). These are planning docs — do not delete them. The Next.js app coexists in the same directory.
- **The `.env.local` file may already exist** from Task 2 (Supabase setup). If it does, don't overwrite it — just verify it has the right vars. Create `.env.local.example` as the template for version control.
- **Font files come from the Cambrian website** at `/Users/abhay-ryze/Desktop/Cambrian/cambrian website v1/assets/fonts/`. Copy `test-die-grotesk-a-regular.woff2` and `test-die-grotesk-vf-roman.woff2` to `public/fonts/`.
- **Don't add `Die Grotesk B` as a separate woff2 named "die-grotesk-b"** — the file `test-die-grotesk-vf-roman.woff2` IS Die Grotesk B (it's a variable font). The name is misleading but the design system confirms this mapping.
- **Placeholder files should be minimal.** The goal is that the path exists at the expected location. Future tasks will replace the placeholder content.
- **Don't install any additional UI libraries** (no shadcn, no Radix, no Headless UI). We're building from scratch with Tailwind for V1.
