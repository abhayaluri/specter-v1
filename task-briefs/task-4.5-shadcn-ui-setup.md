# Task 4.5 — shadcn/ui Setup & Design Token Integration

**Status:** NOT STARTED
**Dependencies:** Task 4 (Layout Shell & Navigation — must be complete, which requires Task 1.5 Specter Rebrand)
**Agent type:** Builder
**Estimated effort:** 1 agent session

---

## Objective

Install and configure [shadcn/ui](https://ui.shadcn.com) with Tailwind v4 native support. Migrate our existing Specter design tokens from the `@theme` directive to shadcn's `:root` + `@theme inline` pattern. Validate the setup by adding a Button component. This gives every subsequent task (5–14) access to accessible, battle-tested UI primitives (Dialog, Select, Dropdown, Tabs, etc.) without building from scratch.

This is a **coding task.** You are setting up a component library and migrating design tokens.

---

## Before You Start

Read these files in order:

1. `app/globals.css` — Current Tailwind v4 design tokens (Specter palette)
2. `design-system.md` — Complete Specter design system reference
3. `claude-code-agent-instructions.md` — Component patterns, naming conventions
4. `components/layout/Sidebar.tsx` — Existing component using current token names
5. `components/layout/TopBar.tsx` — Another component with current token names

---

## What's Already Done (Tasks 1–4)

- ✅ Next.js 14 with App Router, TypeScript, Tailwind v4
- ✅ Specter rebrand complete (Task 1.5) — Ghost Cyan accent, True Black bg, Clash Display + Manrope fonts
- ✅ Design tokens in `app/globals.css` using `@theme` directive
- ✅ `cn()` utility in `lib/utils.ts` (clsx + tailwind-merge)
- ✅ Authentication flow (Supabase)
- ✅ Layout shell (AppShell, Sidebar, TopBar)

You're adding shadcn/ui on top of this foundation and migrating the token naming pattern.

---

## Why This Task Exists

shadcn/ui provides accessible, keyboard-navigable UI primitives (Dialog, Select, Dropdown Menu, Tabs, Switch, etc.) that upcoming tasks need:

- **Task 5 (Settings):** Form, Switch, Select, Tabs, Input, Textarea
- **Task 6 (Source Capture):** Dialog, Dropdown Menu, Sonner (toasts)
- **Task 7 (Buckets):** Alert Dialog, Popover, Badge
- **Task 9 (Chat UI):** Scroll Area, Tooltip, Skeleton
- **Task 11 (Draft Mgmt):** Tabs, Badge, Alert Dialog

Building these from scratch would take 25-35 hours. With shadcn, we get WCAG-compliant components in minutes.

---

## Critical Design Decision: Token Name Migration

**The problem:** Our Specter design system uses `--color-accent` for Ghost Cyan (#068BD4). shadcn uses `--accent` for a **neutral hover highlight** (subtle gray), and `--primary` for the **brand color**.

If we naively merge both, `bg-accent` would mean different things in existing components vs. shadcn components. This must be resolved.

**The solution:** Adopt shadcn's naming convention throughout. Our Ghost Cyan becomes `--primary`. Our neutral hover color becomes `--accent`.

| Specter Token (current) | shadcn Equivalent | Tailwind Class |
|---|---|---|
| `--color-accent: #068BD4` (Ghost Cyan) | `--primary` | `bg-primary`, `text-primary` |
| `--color-bg: #030712` (True Black) | `--background` | `bg-background` |
| `--color-surface: #1F2937` (Charcoal) | `--card` | `bg-card` |
| `--color-surface-hover: #2D3748` | `--accent`, `--secondary`, `--muted` | `bg-accent`, `bg-secondary` |
| `--color-surface-subtle: #111827` | `--popover` | `bg-popover` |
| `--color-border: #374151` (Slate) | `--border`, `--input` | `border-border` |
| `--color-text: #FFFFFF` | `--foreground` | `text-foreground` |
| `--color-text-muted: #9CA3AF` | `--muted-foreground` | `text-muted-foreground` |
| `--color-text-dim: #6B7280` | (custom, kept) | `text-text-dim` |
| `--color-error: #EF4444` | `--destructive` | `bg-destructive` |

**After migration:** Existing components update from `bg-accent` → `bg-primary`, `text-accent` → `text-primary`, `bg-surface` → `bg-card`, `text-text` → `text-foreground`, etc.

---

## Step-by-Step Instructions

### Step 1: Install Dependencies

```bash
pnpm add tw-animate-css lucide-react class-variance-authority
```

You already have `clsx` and `tailwind-merge` — don't reinstall.

**What each does:**
- `tw-animate-css` — CSS animations for shadcn components (replaces deprecated `tailwindcss-animate`)
- `lucide-react` — Icon library used by shadcn components
- `class-variance-authority` — For defining component variants (e.g., Button sizes, styles)

### Step 2: Create components.json

Create `components.json` in the project root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Key settings:
- `style: "new-york"` — shadcn's current default (they deprecated the old "default" style)
- `rsc: true` — we use React Server Components
- `config: ""` — no tailwind.config.js (Tailwind v4 CSS-first)
- `css: "app/globals.css"` — our CSS entry point

### Step 3: Rewrite globals.css

Replace the **ENTIRE** contents of `app/globals.css` with this. The new structure uses shadcn's `:root` + `@theme inline` pattern while preserving all Specter design values:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/*
 * Specter Content Engine — Design Tokens
 * Uses shadcn/ui naming convention with Specter color values.
 * Dark-theme-only app. Tokens set on :root directly.
 */
:root {
  /* Core surfaces */
  --background: #030712;
  --foreground: #FFFFFF;
  --card: #1F2937;
  --card-foreground: #FFFFFF;
  --popover: #111827;
  --popover-foreground: #FFFFFF;

  /* Brand / Primary = Ghost Cyan */
  --primary: #068BD4;
  --primary-foreground: #030712;

  /* Neutral highlights (hover backgrounds, subtle accents) */
  --secondary: #2D3748;
  --secondary-foreground: #FFFFFF;
  --muted: #2D3748;
  --muted-foreground: #9CA3AF;
  --accent: #2D3748;
  --accent-foreground: #FFFFFF;

  /* Destructive / Error */
  --destructive: #EF4444;
  --destructive-foreground: #FFFFFF;

  /* Borders & Inputs */
  --border: #374151;
  --input: #374151;
  --ring: #068BD4;

  /* Radius */
  --radius: 0.375rem;

  /* Sidebar (matches our layout) */
  --sidebar: #1F2937;
  --sidebar-foreground: #FFFFFF;
  --sidebar-primary: #068BD4;
  --sidebar-primary-foreground: #030712;
  --sidebar-accent: #2D3748;
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: #374151;
  --sidebar-ring: #068BD4;

  /* ---- Specter extended tokens (not in shadcn standard) ---- */
  --color-text-dim: #6B7280;
  --color-text-on-accent: #030712;
  --color-accent-hover: #0EA5E9;
  --color-accent-dim: rgba(6, 139, 212, 0.15);
  --color-accent-strong: #0284C7;
  --color-surface-subtle: #111827;
  --color-border-light: #4B5563;
  --color-border-strong: #6B7280;
  --color-border-focus: #068BD4;
  --color-modal-overlay: rgba(3, 7, 18, 0.85);
  --color-success: #10B981;
  --color-success-dim: rgba(16, 185, 129, 0.15);
  --color-warning: #F59E0B;
  --color-warning-dim: rgba(245, 158, 11, 0.15);
  --color-error-dim: rgba(239, 68, 68, 0.15);
  --color-info: #068BD4;
  --color-info-dim: rgba(6, 139, 212, 0.15);

  /* Shadows */
  --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-heavy: 0 20px 50px rgba(0, 0, 0, 0.7), 0 8px 20px rgba(0, 0, 0, 0.6);

  /* Transitions */
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
}

@theme inline {
  /* Map CSS variables to Tailwind utility classes */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Radius scale */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Specter extended tokens */
  --color-text-dim: var(--color-text-dim);
  --color-text-on-accent: var(--color-text-on-accent);
  --color-accent-hover: var(--color-accent-hover);
  --color-accent-dim: var(--color-accent-dim);
  --color-accent-strong: var(--color-accent-strong);
  --color-surface-subtle: var(--color-surface-subtle);
  --color-border-light: var(--color-border-light);
  --color-border-strong: var(--color-border-strong);
  --color-border-focus: var(--color-border-focus);
  --color-modal-overlay: var(--color-modal-overlay);
  --color-success: var(--color-success);
  --color-success-dim: var(--color-success-dim);
  --color-warning: var(--color-warning);
  --color-warning-dim: var(--color-warning-dim);
  --color-error-dim: var(--color-error-dim);
  --color-info: var(--color-info);
  --color-info-dim: var(--color-info-dim);

  /* Fonts */
  --font-display: 'Clash Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-sans: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', Monaco, 'Courier New', monospace;
}

/* ========================================
   BASE STYLES
   ======================================== */

@layer base {
  * {
    border-color: var(--border);
  }

  html,
  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    background-color: var(--primary);
    color: white;
  }

  h1 {
    font-family: var(--font-display);
    font-size: 40px;
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  h2 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  h3 {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 500;
    line-height: 1.2;
  }

  h4 {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 500;
    line-height: 1.3;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    h1 { font-size: 32px; }
    h2 { font-size: 24px; }
    h3 { font-size: 20px; }
    h4 { font-size: 18px; }
  }

  /* Focus styles for keyboard navigation */
  *:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
}

/* ========================================
   ANIMATIONS
   ======================================== */

@layer utilities {
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }
}
```

**What changed from the Task 1.5 globals.css:**
- Added `@import "tw-animate-css"` for component animations
- Added `@custom-variant dark` (required by shadcn, even in dark-only apps)
- Replaced `@theme { ... }` with `:root { ... }` + `@theme inline { ... }` (shadcn Tailwind v4 pattern)
- Core color tokens renamed to shadcn convention (`--background`, `--primary`, `--card`, etc.)
- Specter extended tokens kept as custom variables (success, warning, accent-hover, etc.)
- Heading styles use plain CSS properties instead of `@apply` (avoids Tailwind v4 @apply issues)
- Font declarations moved from `@theme` to `@theme inline`
- Added sidebar, popover, and ring variables that shadcn components expect
- Base layer adds `border-color: var(--border)` as shadcn expects

### Step 4: Verify lib/utils.ts

Our `cn()` utility should already be correct. Verify it matches:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

If it already looks like this, no changes needed.

### Step 5: Migrate Existing Components to New Token Names

This is the most important step. Every reference to old Specter token names must be updated to shadcn naming.

**Find-and-replace across all files:**

| Old Class | New Class | Reason |
|---|---|---|
| `bg-bg` | `bg-background` | shadcn names background `--background` |
| `bg-surface` | `bg-card` | shadcn names cards/panels `--card` |
| `bg-surface-hover` | `bg-accent` | shadcn uses `--accent` for neutral hover |
| `bg-surface-subtle` | `bg-popover` | shadcn uses `--popover` for dropdown surfaces |
| `text-text` | `text-foreground` | shadcn names main text `--foreground` |
| `text-text-muted` | `text-muted-foreground` | shadcn convention |
| `bg-accent` (Ghost Cyan) | `bg-primary` | Our brand color → shadcn's primary |
| `text-accent` (Ghost Cyan) | `text-primary` | Our brand color → shadcn's primary |
| `bg-accent/10` etc. | `bg-primary/10` | Opacity variants of brand color |
| `bg-accent/15` etc. | `bg-primary/15` | Opacity variants of brand color |
| `text-error` | `text-destructive` | shadcn convention |
| `bg-error` | `bg-destructive` | shadcn convention |
| `border-border` | `border-border` | (unchanged — same name) |
| `text-text-dim` | `text-text-dim` | (unchanged — custom token) |

**Files to update (check each one):**

1. `components/layout/Sidebar.tsx` — Uses `bg-accent`, `text-accent`, `bg-surface`, `text-text-muted`, `text-text`, `bg-surface-hover`, `bg-bg`, `border-border`, `text-text-dim`
2. `components/layout/TopBar.tsx` — Uses `bg-surface`, `text-text`, `text-text-muted`, `text-accent`
3. `components/layout/AppShell.tsx` — Uses `bg-bg`
4. `app/page.tsx` — Uses `text-text`, `bg-surface`, `text-text-muted`, `border-border`
5. `app/inbox/page.tsx` — Check for old token names
6. `app/buckets/page.tsx` — Check for old token names
7. `app/drafts/page.tsx` — Check for old token names
8. `app/conversations/[id]/page.tsx` — Check for old token names
9. `app/login/page.tsx` — Check for old token names
10. Any other files with Tailwind classes

**Example migration for Sidebar.tsx:**

Before:
```tsx
<div className="w-64 bg-surface border-r border-border flex flex-col">
```

After:
```tsx
<div className="w-64 bg-card border-r border-border flex flex-col">
```

Before:
```tsx
isActive
  ? 'bg-accent/10 text-accent'
  : 'text-text-muted hover:text-text hover:bg-surface-hover'
```

After:
```tsx
isActive
  ? 'bg-primary/10 text-primary'
  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
```

**Do a project-wide search for these patterns to catch everything:**
- Search for `bg-bg` (replace with `bg-background`)
- Search for `bg-surface` (replace with `bg-card`, but NOT `bg-surface-subtle`)
- Search for `text-text` (replace with `text-foreground`, but NOT `text-text-dim`)
- Search for `bg-accent` where it means Ghost Cyan (replace with `bg-primary`)
- Search for `text-accent` where it means Ghost Cyan (replace with `text-primary`)

### Step 6: Add a Test Component (Button)

Run the shadcn CLI to add a Button component:

```bash
npx shadcn@latest add button
```

This will create `components/ui/button.tsx`. Verify it:
- Uses `class-variance-authority` for variants
- References shadcn token names (`bg-primary`, `text-primary-foreground`, etc.)
- Matches our dark theme (Ghost Cyan primary, dark backgrounds)

### Step 7: Create a Quick Validation Page

Temporarily update `app/page.tsx` to test the Button component alongside existing layout:

```tsx
import AppShell from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="mb-6">Dashboard</h1>

        {/* shadcn Button test — remove after verification */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-foreground font-medium mb-2">Sources</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 6</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-foreground font-medium mb-2">Buckets</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 7</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-foreground font-medium mb-2">Drafts</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 11</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
```

### Step 8: Test Everything

Start the dev server:

```bash
pnpm dev
```

**Verify these things:**

1. **No build errors** — app compiles without errors
2. **TypeScript clean** — `pnpm tsc --noEmit` passes
3. **Sidebar renders correctly** — nav items visible, active state shows Ghost Cyan, hover states work
4. **Top bar renders correctly** — user name, avatar with cyan initial
5. **Button variants render** — all 6 variants visible and styled correctly:
   - Primary: Ghost Cyan (#068BD4) background, dark text
   - Secondary: dark gray (#2D3748) background, light text
   - Destructive: red (#EF4444) styling
   - Outline: bordered, transparent background
   - Ghost: no border, transparent, hover highlight
   - Link: text-only, underline on hover
6. **Dark theme consistent** — True Black (#030712) background, no white flashes
7. **Focus styles** — Tab through buttons, verify cyan focus ring
8. **Fonts render** — Clash Display for headings, Manrope for body
9. **No console errors** — open DevTools, check for warnings/errors

### Step 9: Clean Up

After verifying:
1. Remove the Button test section from `app/page.tsx` (the `<div className="flex gap-4 mb-8">` block) — leave the dashboard cards
2. Verify the page still looks correct

### Step 10: Commit

```bash
git add -A
git commit -m "Task 4.5: shadcn/ui setup — design token migration to shadcn naming, tw-animate-css, lucide-react, Button component"
```

---

## Output

A fully configured shadcn/ui setup with:
- shadcn/ui initialized with Tailwind v4 native support
- All Specter design tokens migrated to shadcn naming convention
- Existing components updated to use new token names
- Button component added and validated
- Ready for subsequent tasks to add components via `npx shadcn@latest add <component>`

---

## Acceptance Criteria

- [ ] `tw-animate-css`, `lucide-react`, `class-variance-authority` installed
- [ ] `components.json` exists in project root with correct configuration
- [ ] `app/globals.css` uses shadcn variable pattern (`:root` + `@theme inline`)
- [ ] All existing components migrated from old token names to shadcn names
- [ ] `bg-primary` renders as Ghost Cyan (#068BD4)
- [ ] `bg-background` renders as True Black (#030712)
- [ ] `bg-card` renders as Charcoal (#1F2937)
- [ ] `bg-accent` renders as hover gray (#2D3748)
- [ ] `text-foreground` renders as white (#FFFFFF)
- [ ] `text-muted-foreground` renders as muted (#9CA3AF)
- [ ] `text-destructive` renders as red (#EF4444)
- [ ] Specter extended tokens still work (`bg-success`, `text-text-dim`, etc.)
- [ ] `npx shadcn@latest add button` runs successfully
- [ ] Button component renders all 6 variants correctly
- [ ] Sidebar active state shows Ghost Cyan
- [ ] Sidebar hover state works
- [ ] Heading typography unchanged (Clash Display)
- [ ] Body typography unchanged (Manrope)
- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No console errors or warnings
- [ ] Focus styles (cyan ring) visible for keyboard navigation
- [ ] Git committed with proper message

---

## Reference Files

| File | What to look at |
|------|----------------|
| `design-system.md` | Complete Specter design system |
| `app/globals.css` | Current Tailwind v4 tokens (you're replacing the structure) |
| `components/layout/Sidebar.tsx` | Existing component to migrate |
| `components/layout/TopBar.tsx` | Existing component to migrate |
| `components/layout/AppShell.tsx` | Existing component to migrate |
| `lib/utils.ts` | cn() utility (verify it's correct) |

---

## Notes for the Agent

- **Tailwind v4 native support** — shadcn/ui now fully supports Tailwind v4. No downgrade needed.
- **`@theme inline` NOT `@theme`** — The `@theme inline` directive tells Tailwind these are theme values accessible as utility classes AND in regular CSS. This is the shadcn-recommended pattern for v4.
- **No `.dark` class needed** — Our app is dark-theme-only. The tokens in `:root` are dark values. The `@custom-variant dark` line is required because shadcn components reference it, but it won't affect rendering.
- **`--primary` = Ghost Cyan** — This is the most important mapping. Every Ghost Cyan reference (`bg-accent`, `text-accent`) in existing code must become `bg-primary`, `text-primary`.
- **`--accent` = subtle highlight** — In shadcn, `accent` means a neutral hover background (#2D3748). Don't confuse it with our old "accent" (Ghost Cyan).
- **Extended tokens preserved** — `--color-text-dim`, `--color-accent-hover`, `--color-success`, `--color-warning`, etc. are kept as custom tokens alongside shadcn's standard ones.
- **Don't add extra components yet** — Only add Button for validation. Other components (Dialog, Select, Dropdown, Tabs, etc.) will be added in Tasks 5-11 as needed.
- **lucide-react replaces inline SVGs** — Our Task 4 icons are inline SVGs. You do NOT need to replace them now — that can happen organically in later tasks. But lucide-react is installed and ready.
- **Heading styles use plain CSS** — The base heading styles (`h1`-`h4`) use plain CSS properties instead of `@apply`. This avoids Tailwind v4 @apply edge cases.
- **Run `npx shadcn@latest add button`** — Don't manually create the Button component. Let the CLI generate it so it matches the latest shadcn patterns.

---

## How Future Tasks Will Add Components

After this task, adding a new shadcn component is simple:

```bash
# Task 5 (Settings) will run:
npx shadcn@latest add form switch select tabs input textarea label

# Task 6 (Source Capture) will run:
npx shadcn@latest add dialog dropdown-menu sonner

# Task 7 (Buckets) will run:
npx shadcn@latest add alert-dialog popover badge
```

Each command copies the component source into `components/ui/`. The component uses our Specter design tokens automatically because they're wired through the CSS variables.
