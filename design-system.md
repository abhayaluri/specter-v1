# Cambrian Content Engine — Design System

**Version:** 1.0
**Last Updated:** 2026-02-06
**Source:** Extracted from Cambrian website v1 + PRD design direction

This document is the single source of truth for all visual design decisions in the Cambrian Content Engine. Every builder agent should reference this before writing UI components.

---

## Design Philosophy

The Cambrian Content Engine inherits the visual language of the Cambrian Explorations website: **dark, minimal, generous spacing, subtle animations, warm amber accent**. The aesthetic is professional but understated — content and function first, not flash.

**Core principles:**
- Dark by default (no light mode for V1)
- Generous whitespace and breathing room
- Sharp, crisp typography
- Minimal animation — only where it adds clarity
- Amber/gold accent sparingly for emphasis and brand
- Everything grid-aligned and intentional

---

## 1. Color Palette

### Background & Surfaces

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#141414` | Primary page background (from website) |
| `surface` | `#161616` | Card backgrounds, panels, elevated surfaces |
| `surface-hover` | `#1E1E1E` | Hover state for interactive surfaces (buttons, cards) |

**Note:** The website uses `#141414` as the primary background. The PRD originally referenced `#0D0D0D` — **use `#141414`**. The content engine needs layered surfaces (cards, modals, panels) which the website doesn't have, so `surface` and `surface-hover` are additive.

### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `border` | `#2A2A2A` | Default border color for cards, inputs, dividers |
| `border-light` | `#333333` | Lighter borders for subtle separation, hover states |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#E8E6E3` | Primary text (warm off-white — use this, not pure white) |
| `text-muted` | `#8A8A8A` | Secondary text, labels, timestamps, metadata |
| `text-dim` | `#5A5A5A` | Tertiary text, placeholders, disabled states |

**Note:** The website uses `#ffffff` for text and `#8E8E8E` for muted elements. The content engine uses `#E8E6E3` (warm off-white) for primary text for a softer look. For muted text, use `#8A8A8A` (slightly darker than the website's `#8E8E8E`).

### Accents & Status

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#E8B931` | Cambrian brand gold/amber — CTAs, links, active states, highlights |
| `accent-dim` | `#E8B93122` | Translucent accent (13% opacity) — backgrounds, subtle highlights |
| `danger` | `#D4594E` | Error states, delete actions |
| `success` | `#4A9B6F` | Success states, confirmations, published status |

### Selection

| Token | CSS | Usage |
|-------|-----|-------|
| `::selection` | `background: #ffffff; color: #141414;` | Text selection (inverted — white bg, dark text) |

---

## 2. Typography

### Font Families

| Family | Usage | Files | Fallback Stack |
|--------|-------|-------|----------------|
| **Die Grotesk A** | Display type, page headings (h1) | `test-die-grotesk-a-regular.woff2` | `'Die Grotesk A', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| **Die Grotesk B** | Body text, UI elements, subheadings | `test-die-grotesk-vf-roman.woff2` (variable font) | `'Die Grotesk B', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| **IBM Plex Mono** | Code blocks, monospace content, tabular data | Load via `next/font/google` or `@ibm/plex` npm package | `'IBM Plex Mono', 'Monaco', 'Courier New', monospace` |

**Font Display Strategy:** All fonts use `font-display: swap` to prevent FOIT (Flash of Invisible Text).

**Anti-aliasing:** Apply globally:
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Type Scale

| Element | Family | Size | Weight | Line Height | Other |
|---------|--------|------|--------|-------------|-------|
| **Page Heading (h1)** | Die Grotesk A | `32px` | `400` | `1.2` | `letter-spacing: -0.05em` |
| **Section Heading (h2)** | Die Grotesk B | `24px` | `500` | `1.3` | - |
| **Subsection Heading (h3)** | Die Grotesk B | `18px` | `500` | `1.4` | - |
| **Body Large** | Die Grotesk B | `16px` | `400` | `1.6` | Standard UI text, chat messages |
| **Body** | Die Grotesk B | `15px` | `400` | `1.8` | Paragraph text, long-form content |
| **Body Small** | Die Grotesk B | `14px` | `400` | `1.5` | Captions, metadata, nav labels |
| **Label** | Die Grotesk B | `14px` | `400` | `1.5` | Form labels, input labels, `text-transform: uppercase` for metadata |
| **Caption** | Die Grotesk B | `12px` | `400` | `1.4` | Timestamps, helper text, badges |
| **Button** | Die Grotesk B | `14px` | `500` | `1` | Buttons, CTAs |
| **Input Text** | Die Grotesk B | `15px` | `400` | `1.5` | Text inputs, textareas |
| **Code** | IBM Plex Mono | `14px` | `400` | `1.6` | Inline code, code blocks |

**Mobile Adjustments (≤768px):**
- Page Heading (h1): `28px`
- Body: `15px` (no change)
- Body Small / Label: `12px`
- Caption: `11px`

---

## 3. Spacing & Layout

### Spacing Scale

Use these values consistently for padding, margin, and gaps. Defined as Tailwind utilities:

| Token | Value | Tailwind | Usage |
|-------|-------|----------|--------|
| `xs` | `4px` | `1` | Tight spacing between tightly related elements |
| `sm` | `8px` | `2` | Small gaps, icon spacing |
| `md` | `12px` | `3` | Default gap between UI elements |
| `lg` | `16px` | `4` | Comfortable spacing, button padding |
| `xl` | `24px` | `6` | Section spacing, card padding |
| `2xl` | `32px` | `8` | Large section breaks, page padding (mobile) |
| `3xl` | `48px` | `12` | Page padding (desktop), major section breaks |
| `4xl` | `64px` | `16` | Hero spacing, large vertical rhythm |

### Layout Conventions

**Page Padding:**
- Desktop: `48px` horizontal, `32px` top/bottom
- Mobile: `24px` all sides

**Card Padding:**
- Default: `24px` (all sides)
- Compact: `16px` (for small cards, badges)

**Component Gaps:**
- Between related elements in a group: `12px` (`gap-3`)
- Between form fields: `16px` (`gap-4`)
- Between sections: `32px` (`gap-8`)

**Max Content Width:**
- Conversation / chat thread: `720px`
- Draft content pane: `640px`
- Long-form text (info page): `520px`
- Dashboard cards: full-width with grid (responsive)

---

## 4. Borders & Radii

### Border Style

| Element | Style |
|---------|-------|
| Default border | `1px solid border` (`#2A2A2A`) |
| Light border | `1px solid border-light` (`#333333`) |
| Focus ring | `2px solid accent` (`#E8B931`) with `4px` offset |
| Divider | `1px solid border` (horizontal rule) |

### Border Radius

The Cambrian website uses **sharp corners (no border-radius)**. For the content engine, use **subtle rounding** to soften cards and inputs:

| Element | Radius | Tailwind |
|---------|--------|----------|
| Buttons | `6px` | `rounded-md` |
| Inputs / Textareas | `6px` | `rounded-md` |
| Cards | `8px` | `rounded-lg` |
| Modals | `12px` | `rounded-xl` |
| Badges / Pills | `9999px` | `rounded-full` |
| Images | `4px` | `rounded` |

**Rationale:** The website is entirely sharp-edged, which works for its minimal landing page aesthetic. The content engine has more UI density (cards, forms, inputs) — slight rounding improves usability and visual comfort without undermining the minimal aesthetic.

---

## 5. Animation & Transitions

### Transition Conventions

All animations should be **subtle and purposeful** — add clarity, not distraction.

| Interaction | Duration | Easing | CSS |
|-------------|----------|--------|-----|
| **Hover state** (opacity change) | `200ms` | `ease` | `transition: opacity 0.2s ease` |
| **Hover state** (color/bg change) | `150ms` | `ease` | `transition: background-color 0.15s ease, color 0.15s ease` |
| **Content reveal** (modals, pages) | `400ms` | `ease` | `transition: opacity 0.4s ease, transform 0.4s ease` |
| **Panel slide** (side panels, drawers) | `500ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)` — spring easing |
| **Overlay fade** | `500ms` | `ease` | `transition: opacity 0.5s ease` |
| **Streaming text** (Claude responses) | - | - | No transition — append text directly, let browser handle rendering |

**Tailwind Utilities:**
- Default transition: `transition-all duration-200 ease-in-out`
- Hover opacity: `hover:opacity-70 transition-opacity duration-200`
- Button hover: `hover:bg-surface-hover transition-colors duration-150`

**Do NOT use:**
- GSAP or complex animation libraries (overkill for this app)
- Bounce/elastic easings (too playful for this aesthetic)
- Long animations (>600ms) except for major page transitions

---

## 6. Component Patterns

These are **visual pattern descriptions**, not React code. Use these as a reference when building components.

### Button

**Primary Button** (CTA, high-emphasis action):
```
bg: accent (#E8B931)
text: bg (#141414) — dark text on gold bg for contrast
padding: 12px 24px (py-3 px-6)
border-radius: 6px (rounded-md)
font: Die Grotesk B, 14px, weight 500
hover: bg: accent with 90% brightness, smooth transition
focus: 2px accent ring, 4px offset
```

**Secondary Button** (medium-emphasis action):
```
bg: surface (#161616)
border: 1px solid border (#2A2A2A)
text: text (#E8E6E3)
padding: 12px 24px
border-radius: 6px
hover: bg: surface-hover (#1E1E1E), border: border-light (#333333)
focus: 2px accent ring
```

**Ghost Button** (low-emphasis action):
```
bg: transparent
text: text-muted (#8A8A8A)
padding: 12px 24px
border-radius: 6px
hover: bg: surface (#161616), text: text (#E8E6E3)
```

**Icon Button** (compact, icon-only):
```
bg: transparent
padding: 8px (p-2)
border-radius: 6px
hover: bg: surface (#161616)
```

### Input

**Text Input:**
```
bg: surface (#161616)
border: 1px solid border (#2A2A2A)
text: text (#E8E6E3), 15px
padding: 12px 16px
border-radius: 6px
placeholder: text-dim (#5A5A5A)
focus: border: accent (#E8B931), 2px ring
error: border: danger (#D4594E), red ring
```

**Textarea:**
```
Same as text input, but:
min-height: 120px
resize: vertical
```

### Card

**Default Card** (buckets, sources, drafts):
```
bg: surface (#161616)
border: 1px solid border (#2A2A2A)
padding: 24px
border-radius: 8px (rounded-lg)
hover: border: border-light (#333333), subtle lift (transform: translateY(-2px), shadow)
transition: 200ms ease
```

**Compact Card** (list items, source previews):
```
bg: surface (#161616)
border: 1px solid border (#2A2A2A)
padding: 16px
border-radius: 6px (rounded-md)
```

### Modal

**Modal Overlay:**
```
bg: rgba(0, 0, 0, 0.7) — dark overlay
backdrop-blur: 4px (optional, for depth)
transition: opacity 500ms ease
```

**Modal Content:**
```
bg: surface (#161616)
border: 1px solid border (#2A2A2A)
border-radius: 12px (rounded-xl)
padding: 32px
max-width: 600px
shadow: large (0 20px 60px rgba(0, 0, 0, 0.5))
```

**Modal Close Button:**
```
Icon button (X icon)
position: top-right corner, 16px offset
```

### Badge

**Status Badge** (draft / ready / published):
```
bg: surface (#161616)
border: 1px solid border (#2A2A2A)
text: text-muted (#8A8A8A), 12px, uppercase
padding: 4px 12px (py-1 px-3)
border-radius: 9999px (rounded-full)
```

**Status Colors:**
- Draft: default (border)
- Ready: border: accent (#E8B931), text: accent
- Published: border: success (#4A9B6F), text: success

**Type Badge** (source type, platform):
```
bg: accent-dim (#E8B93122) — translucent gold
text: accent (#E8B931), 12px, uppercase
padding: 4px 12px
border-radius: 9999px
no border
```

### Nav Item

**Active Nav Item:**
```
bg: surface (#161616)
text: text (#E8E6E3)
border-left: 3px solid accent (#E8B931) — indicator
padding: 12px 16px
```

**Inactive Nav Item:**
```
bg: transparent
text: text-muted (#8A8A8A)
padding: 12px 16px
hover: bg: surface (#161616), text: text (#E8E6E3)
```

### Toast / Notification

**Toast Container:**
```
bg: surface (#161616)
border: 1px solid border (#2A2A2A)
border-radius: 8px (rounded-lg)
padding: 16px
shadow: medium (0 8px 24px rgba(0, 0, 0, 0.3))
max-width: 400px
```

**Toast Variants:**
- **Success:** border-left: 4px solid success (#4A9B6F)
- **Error:** border-left: 4px solid danger (#D4594E)
- **Info:** border-left: 4px solid accent (#E8B931)

**Toast Text:**
```
text: text (#E8E6E3), 14px
margin-left: 12px (offset from left border)
```

### Skeleton Loader

**Skeleton Element:**
```
bg: surface (#161616)
border-radius: 4px (rounded)
animation: pulse (Tailwind's built-in pulse)
```

**Skeleton Shimmer (optional enhancement):**
```
background: linear-gradient(90deg, surface 0%, surface-hover 50%, surface 100%)
background-size: 200% 100%
animation: shimmer 1.5s infinite
```

---

## 7. Tailwind Config

Paste this into `tailwind.config.ts`:

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

**Notes:**
- Font families reference CSS variables (`var(--font-grotesk-a)`, etc.) — these are defined via `next/font/local` in the root layout
- The `spring` timing function is available as `ease-spring` for panel/modal transitions
- Default border radius is `4px` for images and generic elements

---

## 8. Font Loading Strategy

### Font Files

Copy the following files from `cambrian website v1/assets/fonts/` to your Next.js project:

- `test-die-grotesk-a-regular.woff2` → Die Grotesk A (display)
- `test-die-grotesk-vf-roman.woff2` → Die Grotesk B (body/UI, variable font)

Place them in: `public/fonts/` or use `next/font/local` (recommended).

### Next.js Font Loading (Recommended)

Use `next/font/local` for Die Grotesk fonts and `next/font/google` for IBM Plex Mono.

**In `app/layout.tsx`:**

```tsx
import localFont from 'next/font/local'
import { IBM_Plex_Mono } from 'next/font/google'

// Die Grotesk A (display)
const groteskA = localFont({
  src: '../public/fonts/test-die-grotesk-a-regular.woff2',
  variable: '--font-grotesk-a',
  display: 'swap',
  weight: '400',
})

// Die Grotesk B (body/UI, variable font)
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

**Global CSS (app/globals.css):**

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

### Alternative: `@font-face` Declarations

If not using `next/font`, add to `app/globals.css`:

```css
@font-face {
  font-family: 'Die Grotesk A';
  src: url('/fonts/test-die-grotesk-a-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Die Grotesk B';
  src: url('/fonts/test-die-grotesk-vf-roman.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* IBM Plex Mono via npm package or Google Fonts */
```

Then update `tailwind.config.ts` to reference the font family names directly instead of CSS variables.

---

## Summary Checklist

- [x] Complete color palette with hex values, semantic names, and usage notes
- [x] Typography scale: font families, sizes, weights, line heights for all use cases
- [x] Spacing and layout conventions (desktop + mobile)
- [x] Border and radius conventions
- [x] Animation/transition conventions
- [x] Component style patterns for: button, input, card, modal, badge, nav item, toast, skeleton
- [x] Ready-to-paste `tailwind.config.ts` theme extension
- [x] Font files identified and loading strategy documented (local woff2 + IBM Plex Mono)
- [x] Background color reconciled: uses `#141414` from the website (not `#0D0D0D`)
- [x] No conflicts between the design system and existing PRD/CLAUDE.md design specs

---

## Design System Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-06 | Initial extraction from Cambrian website v1 + PRD |

---

**End of Design System Document**
