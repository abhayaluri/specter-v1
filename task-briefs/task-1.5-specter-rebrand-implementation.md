# Task 1.5 — Specter Rebrand Implementation

**Status:** NOT STARTED
**Dependencies:** Task 0 (Design System — COMPLETE), Task 1 (Project Scaffolding — COMPLETE)
**Agent type:** Builder
**Estimated effort:** 1 agent session

---

## Objective

Implement the complete Specter rebrand across the existing codebase. Replace all Cambrian brand elements (Die Grotesk fonts, amber accent, #141414 background) with the new Specter design system (Clash Display/Manrope fonts, Ghost Cyan accent, True Black #030712 background).

This is a **coding task.** You are updating existing code to match the new design system.

---

## Before You Start

Read these files:

1. `design-system.md` — **Complete Specter design system** (your source of truth)
2. Current `app/globals.css` — Existing Tailwind v4 config (will be replaced)
3. Current `app/layout.tsx` — Existing font loading (will be updated)
4. `/Users/abhay-ryze/Downloads/ClashDisplay_Complete.zip` — Clash Display fonts
5. `/Users/abhay-ryze/Downloads/Manrope.zip` — Manrope fonts
6. `/Users/abhay-ryze/Downloads/Union (1).svg` — Specter logo mark

---

## What Needs to Change

### Cambrian (OLD) → Specter (NEW)

| Element | Cambrian | Specter |
|---------|----------|---------|
| **Display Font** | Die Grotesk A | Clash Display |
| **Body Font** | Die Grotesk B | Manrope |
| **Monospace** | IBM Plex Mono | JetBrains Mono |
| **Primary Accent** | Amber `#E8B931` | Ghost Cyan `#068BD4` |
| **Background** | `#141414` | True Black `#030712` |
| **Surface** | `#161616` | Charcoal `#1F2937` |
| **Border** | `#2A2A2A` | Slate `#374151` |
| **Text Muted** | `#8A8A8A` | `#9CA3AF` |

---

## Step-by-Step Instructions

### Step 1: Extract and Copy Font Files

**Clash Display:**
1. Unzip `/Users/abhay-ryze/Downloads/ClashDisplay_Complete.zip`
2. Locate these `.woff2` files:
   - `ClashDisplay-Medium.woff2` (weight 600 — primary)
   - `ClashDisplay-Regular.woff2` (weight 500 — secondary, if available)
   - Or similar naming: look for Medium/Semibold weights
3. Copy to: `public/fonts/clash-display/`

**Manrope:**
1. Unzip `/Users/abhay-ryze/Downloads/Manrope.zip`
2. Locate these `.woff2` files:
   - `Manrope-Light.woff2` (weight 300)
   - `Manrope-Regular.woff2` (weight 400)
   - `Manrope-Bold.woff2` (weight 700)
3. Copy to: `public/fonts/manrope/`

**Note:** If the exact filenames don't match, look for similar weights and adjust the `src` paths in Step 3 accordingly.

### Step 2: Copy Logo

Copy `/Users/abhay-ryze/Downloads/Union (1).svg` to:
- `public/logo/specter-mark.svg`

Create the directory if it doesn't exist:
```bash
mkdir -p public/logo
cp "/Users/abhay-ryze/Downloads/Union (1).svg" public/logo/specter-mark.svg
```

### Step 3: Update Font Loading in Layout

Replace the font loading in `app/layout.tsx`:

**OLD (Die Grotesk A/B + IBM Plex Mono):**
```tsx
import localFont from 'next/font/local'
import { IBM_Plex_Mono } from 'next/font/google'

const groteskA = localFont({
  src: '../public/fonts/test-die-grotesk-a-regular.woff2',
  variable: '--font-grotesk-a',
  display: 'swap',
  weight: '400',
})

const groteskB = localFont({
  src: '../public/fonts/test-die-grotesk-vf-roman.woff2',
  variable: '--font-grotesk-b',
  display: 'swap',
  weight: '400',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap',
  weight: ['400', '500'],
})
```

**NEW (Clash Display + Manrope + JetBrains Mono):**
```tsx
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'

// Clash Display (display font for headlines)
const clashDisplay = localFont({
  src: [
    {
      path: '../public/fonts/clash-display/ClashDisplay-Medium.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/clash-display/ClashDisplay-Regular.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
})

// Manrope (body font for UI and text)
const manrope = localFont({
  src: [
    {
      path: '../public/fonts/manrope/Manrope-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/manrope/Manrope-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/manrope/Manrope-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
})

// JetBrains Mono (monospace for code)
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
})
```

**Update the HTML className:**

OLD:
```tsx
<html
  lang="en"
  className={`${groteskA.variable} ${groteskB.variable} ${ibmPlexMono.variable}`}
>
```

NEW:
```tsx
<html
  lang="en"
  className={`${clashDisplay.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
>
```

**Update metadata (optional but recommended):**
```tsx
export const metadata: Metadata = {
  title: 'Specter Content Engine',
  description: 'Content creation platform — Invisible Intelligence',
}
```

### Step 4: Replace app/globals.css

Replace the **ENTIRE** contents of `app/globals.css` with the Tailwind v4 config from `design-system.md` (lines 590-748).

Copy this exactly:

```css
@import "tailwindcss";

@theme {
  /* ========================================
     COLORS
     ======================================== */

  /* Backgrounds */
  --color-bg: #030712;
  --color-surface: #1F2937;
  --color-surface-hover: #2D3748;
  --color-surface-subtle: #111827;
  --color-modal-overlay: rgba(3, 7, 18, 0.85);

  /* Borders */
  --color-border: #374151;
  --color-border-light: #4B5563;
  --color-border-strong: #6B7280;
  --color-border-focus: #068BD4;

  /* Text */
  --color-text: #FFFFFF;
  --color-text-muted: #9CA3AF;
  --color-text-dim: #6B7280;
  --color-text-on-accent: #030712;

  /* Accents */
  --color-accent: #068BD4;
  --color-accent-hover: #0EA5E9;
  --color-accent-dim: rgba(6, 139, 212, 0.15);
  --color-accent-strong: #0284C7;

  /* State Colors */
  --color-success: #10B981;
  --color-success-dim: rgba(16, 185, 129, 0.15);
  --color-warning: #F59E0B;
  --color-warning-dim: rgba(245, 158, 11, 0.15);
  --color-error: #EF4444;
  --color-error-dim: rgba(239, 68, 68, 0.15);
  --color-info: #068BD4;
  --color-info-dim: rgba(6, 139, 212, 0.15);

  /* ========================================
     TYPOGRAPHY
     ======================================== */

  --font-display: 'Clash Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-sans: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', Monaco, 'Courier New', monospace;

  /* ========================================
     SPACING (8-point grid)
     ======================================== */

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-base: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;
  --spacing-4xl: 96px;

  /* ========================================
     BORDER RADIUS
     ======================================== */

  --radius-sm: 4px;
  --radius: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* ========================================
     SHADOWS
     ======================================== */

  --shadow-subtle: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4);
  --shadow-heavy: 0 20px 50px rgba(0, 0, 0, 0.7), 0 8px 20px rgba(0, 0, 0, 0.6);

  /* ========================================
     TRANSITIONS
     ======================================== */

  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
}

/* ========================================
   BASE STYLES
   ======================================== */

@layer base {
  html,
  body {
    @apply bg-bg text-text font-sans;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  ::selection {
    @apply bg-accent text-white;
  }

  h1 {
    @apply font-display text-[40px] font-semibold leading-tight tracking-tight;
  }

  h2 {
    @apply font-display text-[28px] font-semibold leading-snug tracking-tight;
  }

  h3 {
    @apply font-display text-[24px] font-medium leading-snug;
  }

  h4 {
    @apply font-display text-[20px] font-medium leading-normal;
  }

  /* Mobile adjustments */
  @media (max-width: 768px) {
    h1 {
      @apply text-[32px];
    }

    h2 {
      @apply text-[24px];
    }

    h3 {
      @apply text-[20px];
    }

    h4 {
      @apply text-[18px];
    }
  }

  /* Focus styles for keyboard navigation */
  *:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
}

/* ========================================
   ANIMATIONS
   ======================================== */

@layer utilities {
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }
}
```

**CRITICAL:** This replaces the old Cambrian color scheme entirely. All Tailwind classes like `bg-accent`, `text-text`, `border-border` now reference the new Specter colors.

### Step 5: Update Sidebar Logo and Branding

Update `components/layout/Sidebar.tsx`:

**OLD (Cambrian text-only):**
```tsx
<div className="h-16 flex items-center px-6 border-b border-border">
  <h1 className="font-display text-lg tracking-tight text-text">
    Cambrian
  </h1>
</div>
```

**NEW (Specter logo + wordmark):**
```tsx
<div className="h-16 flex items-center gap-3 px-6 border-b border-border">
  <img
    src="/logo/specter-mark.svg"
    alt="Specter"
    className="w-8 h-8"
  />
  <h1 className="font-display text-lg tracking-tight text-text">
    Specter
  </h1>
</div>
```

Alternative (if you want logo only, no text):
```tsx
<div className="h-16 flex items-center justify-center border-b border-border">
  <img
    src="/logo/specter-mark.svg"
    alt="Specter"
    className="w-10 h-10"
  />
</div>
```

### Step 6: Update Dashboard Placeholder Text

Update `app/page.tsx`:

**OLD:**
```tsx
<h1 className="font-display text-[32px] tracking-tight text-text mb-6">
  Cambrian Content Engine
</h1>
<p className="text-text-muted text-sm">
  Dashboard — coming soon
</p>
```

**NEW:**
```tsx
<h1 className="font-display text-[32px] tracking-tight text-text mb-6">
  Specter Content Engine
</h1>
<p className="text-text-muted text-sm">
  Invisible Intelligence
</p>
```

### Step 7: Remove Old Font Files (Optional)

The old Cambrian fonts are no longer needed:

```bash
rm -rf public/fonts/test-die-grotesk-a-regular.woff2
rm -rf public/fonts/test-die-grotesk-vf-roman.woff2
```

**DO NOT** delete `public/fonts/` directory entirely — keep the new Clash Display and Manrope folders.

### Step 8: Update Footer (if it exists)

If there's a footer with "Compound / Cambrian", update it:

**OLD:**
```tsx
<p className="text-xs text-text-dim text-center">
  Compound / Cambrian
</p>
```

**NEW:**
```tsx
<p className="text-xs text-text-dim text-center">
  Specter by Compound
</p>
```

Or remove it entirely if you prefer a cleaner look.

### Step 9: Test the Rebrand

Start the dev server and verify:

```bash
pnpm dev
```

Open `http://localhost:3000` and check:

**Visual verification:**
- [ ] Background is **True Black** (#030712) — darker than before
- [ ] Sidebar/cards are **Charcoal** (#1F2937) — lighter than background
- [ ] All headings use **Clash Display** font (check in devtools)
- [ ] All body text uses **Manrope** font
- [ ] Specter logo appears in sidebar (white on black)
- [ ] Links/buttons use **Ghost Cyan** (#068BD4) — not amber
- [ ] Text is **Pure White** (#FFFFFF) — crisp and clear
- [ ] Borders are **Slate** (#374151) — visible but subtle

**Browser devtools check:**
1. Inspect a heading → Computed styles → font-family should show `Clash Display`
2. Inspect body text → font-family should show `Manrope`
3. Inspect the accent color → Should be `#068BD4` (Ghost Cyan)
4. Check background color → Should be `#030712` (True Black)

**Console check:**
- [ ] No font loading errors
- [ ] No missing asset warnings
- [ ] No TypeScript errors

### Step 10: Verify All Pages

Navigate through the app and check each page:

1. **Dashboard (/)** — Logo, headings, body text
2. **Login (/login)** — Form inputs, button colors
3. **Inbox (/inbox)** — Placeholder text
4. **Buckets (/buckets)** — Placeholder text
5. **Conversations (/conversations/[id])** — Placeholder text
6. **Drafts (/drafts)** — Placeholder text
7. **Settings (/settings)** — Placeholder text

All pages should use:
- New fonts (Clash Display + Manrope)
- New colors (Ghost Cyan accent, True Black bg)
- Specter branding

### Step 11: Commit the Rebrand

```bash
git add -A
git commit -m "Task 1.5: Specter rebrand — new fonts (Clash Display, Manrope), Ghost Cyan accent, True Black bg, logo"
```

---

## Output

A fully rebranded application with:
- Specter design system implemented
- Clash Display + Manrope + JetBrains Mono fonts loaded
- Ghost Cyan accent color (#068BD4) replacing Cambrian amber
- True Black background (#030712) replacing Cambrian #141414
- Specter logo in sidebar
- All color tokens updated to Tailwind v4 config
- No visual references to Cambrian brand

---

## Acceptance Criteria

- [ ] Clash Display font loads correctly (check in devtools)
- [ ] Manrope font loads correctly (check in devtools)
- [ ] JetBrains Mono font available (check in devtools)
- [ ] Background is True Black (#030712)
- [ ] Accent color is Ghost Cyan (#068BD4) — no amber anywhere
- [ ] Specter logo appears in sidebar
- [ ] "Cambrian" text replaced with "Specter" throughout app
- [ ] Old font files (Die Grotesk) removed from public/fonts/
- [ ] New font files (Clash Display, Manrope) present in public/fonts/
- [ ] app/globals.css has complete Tailwind v4 @theme config
- [ ] app/layout.tsx loads Clash Display, Manrope, JetBrains Mono
- [ ] No TypeScript errors (`pnpm tsc --noEmit` passes)
- [ ] No console errors or font loading warnings
- [ ] All pages use new design system
- [ ] Git committed with proper message

---

## Reference Files

| File | What to look at |
|------|----------------|
| `design-system.md` | Complete Specter design system (Section 8 for Tailwind config, Section 9 for font loading) |
| `/Users/abhay-ryze/Downloads/ClashDisplay_Complete.zip` | Clash Display font files |
| `/Users/abhay-ryze/Downloads/Manrope.zip` | Manrope font files |
| `/Users/abhay-ryze/Downloads/Union (1).svg` | Specter logo mark |
| Current `app/globals.css` | Old Cambrian @theme config (will be replaced) |
| Current `app/layout.tsx` | Old font loading (will be updated) |

---

## Notes for the Agent

- **This is a visual rebrand, not a functional change.** The app works the same; it just looks different.
- **All color changes are automatic** once you update `app/globals.css`. Tailwind classes like `bg-accent` will automatically use Ghost Cyan instead of amber.
- **Font changes require updating layout.tsx** to load the new fonts via `next/font/local`.
- **If font filenames don't match exactly**, adjust the `src` paths in `layout.tsx`. The weights are more important than the exact filenames.
- **Manrope is available on Google Fonts** as a fallback if the local files are problematic. Use `next/font/google` instead of `localFont`.
- **The logo SVG is monochrome** (fill: #030712). It will appear as True Black on light backgrounds, which is wrong. For the sidebar (dark background), you may need to invert it or use a white version. Check the SVG and adjust if needed:
  ```tsx
  <img src="/logo/specter-mark.svg" alt="Specter" className="invert" />
  ```
  The `invert` class will make the logo white on dark backgrounds.
- **Don't change component structure** — just fonts, colors, and branding text. The layout stays the same.
- **Test on both desktop and mobile** — fonts should look crisp at all sizes.

---

## Troubleshooting

**Fonts not loading:**
- Check file paths in `layout.tsx` — must match actual filenames
- Check browser Network tab — fonts should return 200, not 404
- Check console for font loading errors
- Try using `next/font/google` for Manrope as a fallback

**Colors not updating:**
- Make sure `app/globals.css` was completely replaced
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Check Tailwind classes are correct (e.g., `bg-accent` not `bg-amber-500`)
- Run `pnpm dev` to rebuild

**Logo not showing:**
- Check file exists at `public/logo/specter-mark.svg`
- Check SVG fill color — may need to invert for dark backgrounds
- Try `className="invert"` or `className="brightness-0 invert"` to make it white

**TypeScript errors:**
- Run `pnpm tsc --noEmit` to see all errors
- Most likely cause: font import names changed (groteskA → clashDisplay, etc.)
- Update any references to old font variables

---

## Visual Comparison

**Before (Cambrian):**
- Amber accent (#E8B931) — warm, literary
- Die Grotesk A/B fonts — geometric, unique
- #141414 background — dark but not pure black
- "Cambrian" branding

**After (Specter):**
- Ghost Cyan accent (#068BD4) — cool, technical
- Clash Display (display) + Manrope (body) — high-fashion meets high-tech
- True Black (#030712) background — deep, dramatic, mysterious
- "Specter" branding with geometric logo mark
- "Invisible intelligence" aesthetic — minimal, confident, purposeful
