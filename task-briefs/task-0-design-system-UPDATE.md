# Task 0 — Design System Extraction (SPECTER REBRAND)

**Status:** NOT STARTED
**Dependencies:** None
**Agent type:** Research + Documentation
**Estimated effort:** 1 agent session

---

## Objective

Study the Specter brand guidelines and extract a comprehensive design system for the content engine. Replace the existing Cambrian design system with Specter's brand identity. Produce an updated `design-system.md` that every subsequent builder agent references for UI work.

This is a **documentation task, not a coding task.** You are extracting design tokens and creating the design system spec, not building components.

---

## Before You Start

Read these brand files in order:

1. `/Users/abhay-ryze/Downloads/Screenshot 2026-02-06 at 10.42.11 PM.png` — Specter logo (white on black)
2. `/Users/abhay-ryze/Downloads/SHR-ID-Guidelines-13.png` — Typography: Clash Display
3. `/Users/abhay-ryze/Downloads/SHR-ID-Guidelines-14.png` — Typography: Manrope
4. `/Users/abhay-ryze/Downloads/SHR-ID-Guidelines-17.png` — Color system (Pure White, Ghost Cyan, Slate, Charcoal, True Black)
5. `/Users/abhay-ryze/Downloads/Union (1).svg` — Specter logo mark (SVG)

**Font files (for reference, will be used in Task 1 scaffolding):**
- Clash Display: `/Users/abhay-ryze/Downloads/ClashDisplay_Complete.zip`
- Manrope: `/Users/abhay-ryze/Downloads/Manrope.zip`

Then review the product requirements to understand what the content engine needs:
- `product-requirements-document.md` → General app structure and features
- The existing `design-system.md` (if it exists) → Understand the structure, then replace it

---

## Brand Analysis

### Typography (from brand guidelines)

**Clash Display** — Display font
- Foundry: Indian Type Foundry, Year 1780
- Description: "A luxuriously bold yet dramatically geometric forma that command immediate attention. It's more vision and character. It signals luxury, brand feel—the kind that hits with a high-fashion media high-tech."
- Styles: Neutral, Medium, Bulky
- **Usage:** Headlines, page titles, brand moments

**Manrope** — Body font
- Foundry: Mikhail Sharanda, Year 2021
- Description: "Balances Clash's drama with geometric simplicity and excellent readability. Its clean, unfussy forms ensure that while headlines grab attention, body text remains effortlessly readable in both light and dark modes."
- Styles: Light, Regular, Bold
- **Usage:** Body text, UI labels, paragraphs, navigation

**Note:** The brand guidelines do NOT specify a monospace font. You should recommend **JetBrains Mono** or **IBM Plex Mono** for code/monospace needs (console logs, API responses, technical data).

### Color System (from brand guidelines)

**Primary Palette:**
- **Pure White** — `#FFFFFF` — Text on dark backgrounds, pure accents
- **Ghost Cyan** — `#068BD4` — Primary brand accent (replaces Cambrian's amber)
- **Slate** — `#374151` — Secondary surfaces, borders
- **Charcoal** — `#1F2937` — Dark surfaces, cards
- **True Black** — `#030712` — Primary background

**Your job:** Expand this into a full semantic palette for a content engine. The brand gives you 5 colors. You need to define:
- Background hierarchy (True Black is primary, what about surfaces, cards, modals?)
- Text hierarchy (Pure White is primary, what about muted, dimmed, disabled text?)
- Border colors (Slate is mentioned, define light/dark variants)
- State colors (success, warning, error, info) — Specter brand doesn't define these, so you design them to be consistent with the Ghost Cyan accent and dark aesthetic
- Hover/focus states

**Recommendation:** Use True Black (#030712) as the primary background, Charcoal (#1F2937) for elevated surfaces (cards, sidebar), Slate (#374151) for borders, Pure White (#FFFFFF) for primary text, and Ghost Cyan (#068BD4) for accents, links, active states.

### Logo & Iconography

- **Logo mark:** Geometric negative-space "S" shape (available as SVG)
- **Style:** Minimal, geometric, clever use of negative space
- **Philosophy:** "Invisible intelligence" — the "S" is formed by what's absent, not present

---

## What to Extract

### 1. Color Palette

Create a complete semantic color system based on the 5 brand colors. Define:

**Backgrounds:**
- `bg` — Primary app background (True Black: #030712)
- `surface` — Elevated elements like cards, sidebar (Charcoal: #1F2937)
- `surface-hover` — Hover state for surfaces (lighter variant of Charcoal, e.g., #2D3748)
- `modal-overlay` — Semi-transparent overlay (rgba(3, 7, 18, 0.8))

**Borders:**
- `border` — Default borders (Slate: #374151)
- `border-light` — Subtle dividers (lighter variant, e.g., #4B5563)
- `border-focus` — Focus ring (Ghost Cyan: #068BD4)

**Text:**
- `text` — Primary text (Pure White: #FFFFFF)
- `text-muted` — Secondary text (lighter Slate, e.g., #9CA3AF)
- `text-dim` — Tertiary/placeholder text (e.g., #6B7280)
- `text-on-accent` — Text on Ghost Cyan background (True Black or Pure White depending on contrast)

**Accents:**
- `accent` — Primary brand accent (Ghost Cyan: #068BD4)
- `accent-hover` — Hover state (lighter cyan, e.g., #0EA5E9)
- `accent-dim` — Subtle accent background (Ghost Cyan at low opacity, e.g., #068BD422)

**State colors** (you design these — brand doesn't specify):
- `success` — Success states (suggest: emerald/teal to complement cyan)
- `warning` — Warning states (suggest: amber/yellow)
- `error` — Error/danger states (suggest: red/rose)
- `info` — Info states (can reuse Ghost Cyan)

Document each color with:
- Hex value
- Semantic name
- Usage notes
- Contrast ratios where relevant (WCAG AA compliance)

### 2. Typography Scale

Build a complete type scale using **Clash Display** and **Manrope**.

**Font stack:**
- Display: Clash Display → fallback to system sans-serif
- Body: Manrope → fallback to system sans-serif
- Monospace: JetBrains Mono or IBM Plex Mono → Monaco → Courier New → monospace

**Type scale to define:**

| Element | Font | Weight | Size | Line Height | Letter Spacing |
|---------|------|--------|------|-------------|----------------|
| Page Title (h1) | Clash Display | Medium | 32-40px | 1.1 | -0.02em |
| Section Heading (h2) | Clash Display | Medium | 24-28px | 1.2 | -0.01em |
| Subsection (h3) | Clash Display | Neutral | 20-24px | 1.3 | 0 |
| Body Large | Manrope | Regular | 16px | 1.6 | 0 |
| Body Standard | Manrope | Regular | 15px | 1.5 | 0 |
| Body Small | Manrope | Regular | 14px | 1.5 | 0 |
| Caption | Manrope | Regular | 13px | 1.4 | 0 |
| Label (UI) | Manrope | Bold | 14px | 1.4 | 0 |
| Button | Manrope | Bold | 15px | 1 | 0 |
| Code/Mono | JetBrains Mono | Regular | 14px | 1.5 | 0 |

**Mobile adjustments:**
- Page titles: reduce by 4-8px
- Section headings: reduce by 2-4px
- Body text: keep the same (readability priority)

### 3. Spacing & Layout

Define a spacing scale for the content engine using an 8-point grid system:

**Base unit:** 8px

**Scale:**
- `spacing-1` — 4px (tight gaps, icon spacing)
- `spacing-2` — 8px (compact spacing)
- `spacing-3` — 12px (small gaps)
- `spacing-4` — 16px (default gap)
- `spacing-6` — 24px (comfortable spacing)
- `spacing-8` — 32px (section spacing)
- `spacing-12` — 48px (page padding)
- `spacing-16` — 64px (large spacing)

**Layout conventions:**
- Page padding (desktop): 48px
- Page padding (mobile): 24px
- Card padding: 24px
- Card gap: 16px
- Sidebar width: 256px (desktop), hidden (mobile)
- Top bar height: 64px
- Button padding: 12px 24px (vertical, horizontal)
- Input padding: 12px 16px

### 4. Borders & Radii

**Border style:**
- Default width: 1px
- Default color: `border` (Slate #374151)
- Focus width: 2px
- Focus color: `accent` (Ghost Cyan #068BD4)

**Border radius:**
- **Default:** 6px (subtle rounding for modern feel)
- **Small (badges, pills):** 4px
- **Medium (cards):** 8px
- **Large (modals):** 12px
- **Full (avatars, pills):** 9999px

The brand guidelines show sharp corners on the logo, but for UI elements (buttons, inputs, cards), a subtle border radius improves usability and feels more modern.

### 5. Shadows & Depth

Define shadow levels for elevation:

**None** — Flat elements (default)
**Subtle** — Slightly elevated cards:
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
```

**Medium** — Dropdowns, popovers:
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
```

**Heavy** — Modals, overlays:
```css
box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
```

### 6. Animation & Transitions

Define transition conventions:

**Default (UI interactions):**
- Duration: 150ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (spring easing)
- Properties: `color, background-color, border-color, opacity`

**Content reveals:**
- Duration: 300ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`
- Properties: `opacity, transform`

**Page transitions:**
- Duration: 400ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)`

**Hover states:**
- Buttons: opacity 0.9 or slight background lightening
- Links: color shift to `accent-hover`
- Cards: background shift to `surface-hover`

### 7. Component Patterns

Define visual patterns for these components (description + Tailwind classes):

**Button variants:**
- **Primary:** Ghost Cyan background, True Black text, rounded corners
  ```
  bg-accent text-black px-6 py-3 rounded-md font-bold hover:bg-accent-hover transition-all
  ```
- **Secondary:** Charcoal background, Pure White text, border
  ```
  bg-surface text-text border border-border px-6 py-3 rounded-md font-bold hover:bg-surface-hover transition-all
  ```
- **Ghost:** Transparent, Pure White text
  ```
  bg-transparent text-text px-6 py-3 rounded-md font-bold hover:bg-surface transition-all
  ```

**Input:**
```
bg-surface border border-border text-text px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent transition-all
```

**Card:**
```
bg-surface border border-border rounded-lg p-6
```

**Modal:**
- Overlay: `fixed inset-0 bg-modal-overlay backdrop-blur-sm`
- Content: `bg-surface border border-border rounded-xl p-8 shadow-heavy`

**Badge (status/type indicators):**
```
px-3 py-1 rounded-full text-sm font-bold
```
- Draft: `bg-slate/20 text-slate`
- Ready: `bg-accent/20 text-accent`
- Published: `bg-success/20 text-success`

**Navigation item:**
- Inactive: `text-text-muted hover:text-text hover:bg-surface-hover`
- Active: `text-accent bg-accent-dim`

**Toast notification:**
- Success: `bg-success/10 border-success/30 text-success`
- Error: `bg-error/10 border-error/30 text-error`
- Info: `bg-accent/10 border-accent/30 text-accent`

**Skeleton loader:**
```
bg-surface animate-pulse rounded
```

### 8. Tailwind Config

Produce a ready-to-paste theme extension for `app/globals.css` using **Tailwind v4 CSS-based config** (NOT tailwind.config.ts).

**CRITICAL:** This project uses **Tailwind v4**, which requires the `@theme` directive in CSS, not a JavaScript config file.

Structure:
```css
@theme {
  /* Colors */
  --color-bg: #030712;
  --color-surface: #1F2937;
  --color-surface-hover: #2D3748;
  --color-border: #374151;
  --color-border-light: #4B5563;
  --color-text: #FFFFFF;
  --color-text-muted: #9CA3AF;
  --color-text-dim: #6B7280;
  --color-accent: #068BD4;
  --color-accent-hover: #0EA5E9;
  --color-accent-dim: #068BD422;
  /* Add all semantic colors here */

  /* Font families */
  --font-display: 'Clash Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-sans: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', Monaco, 'Courier New', monospace;

  /* Spacing (if needed beyond Tailwind defaults) */

  /* Border radius */
  --radius-sm: 4px;
  --radius: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### 9. Font Loading Strategy

Document how to load the fonts in Next.js 14:

**Clash Display & Manrope:**
- **Font files are available in Downloads:**
  - Clash Display: `/Users/abhay-ryze/Downloads/ClashDisplay_Complete.zip`
  - Manrope: `/Users/abhay-ryze/Downloads/Manrope.zip`
- Unzip these files and identify the specific font files needed:
  - Clash Display: Likely `.ttf`, `.otf`, or `.woff2` files for Medium weight (primary), Neutral (secondary)
  - Manrope: `.ttf`, `.otf`, or `.woff2` files for Regular (400), Bold (700), and optionally Light (300)
- Loading strategy: Use `next/font/local` to load from `public/fonts/` directory
- Copy the required font files to the Next.js project during scaffolding

**JetBrains Mono / IBM Plex Mono:**
- Free, available via Google Fonts or npm
- Use `next/font/google`

**Anti-aliasing:**
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### 10. Logo Usage

Document how to use the Specter logo:

**Logo mark:** `/Users/abhay-ryze/Downloads/Union (1).svg`
- Copy to `public/logo/specter-mark.svg` in the Next.js project
- Usage: Sidebar branding, favicon, loading states
- Colors: White on dark backgrounds, or True Black on light backgrounds

**Wordmark:** "Specter" in Clash Display
- Use the display font to render the wordmark programmatically
- Do NOT use a static image unless necessary

---

## Output

Create/replace the file: `design-system.md` in the project root.

Structure it with these sections:

1. **Brand Identity** — Overview of Specter brand (colors, typography, philosophy)
2. **Color Palette** — Full semantic color system with hex values and usage
3. **Typography** — Type scale, font families, weights, sizes
4. **Spacing & Layout** — 8-point grid, layout conventions
5. **Borders & Radii** — Border styles, corner radii
6. **Shadows & Depth** — Elevation system
7. **Animation & Transitions** — Timing, easing, patterns
8. **Component Patterns** — Visual specs for buttons, inputs, cards, etc.
9. **Tailwind v4 Config** — Ready-to-paste @theme directive for globals.css
10. **Font Loading** — Next.js font loading instructions
11. **Logo & Assets** — Logo usage guidelines

---

## Acceptance Criteria

- [ ] Complete color palette with all semantic tokens (bg, surface, text, accent, states)
- [ ] Typography scale with Clash Display (display) and Manrope (body)
- [ ] Monospace font specified (JetBrains Mono or IBM Plex Mono)
- [ ] Spacing scale using 8-point grid
- [ ] Border and radius conventions defined
- [ ] Shadow system for elevation
- [ ] Animation/transition patterns defined
- [ ] Component patterns for at least: button (3 variants), input, card, modal, badge, nav item, toast, skeleton
- [ ] **Tailwind v4 @theme directive** ready to paste into globals.css (NOT tailwind.config.ts)
- [ ] Font loading strategy documented (next/font/google or next/font/local)
- [ ] Logo file location and usage documented
- [ ] Ghost Cyan (#068BD4) used as primary accent (replaces Cambrian's amber)
- [ ] True Black (#030712) used as primary background
- [ ] No conflicts with Next.js 14 or Tailwind v4

---

## Reference Files

| File | What to look at |
|------|----------------|
| `/Users/abhay-ryze/Downloads/Screenshot 2026-02-06 at 10.42.11 PM.png` | Specter logo (white on black) |
| `/Users/abhay-ryze/Downloads/SHR-ID-Guidelines-13.png` | Clash Display font specimen |
| `/Users/abhay-ryze/Downloads/SHR-ID-Guidelines-14.png` | Manrope font specimen |
| `/Users/abhay-ryze/Downloads/SHR-ID-Guidelines-17.png` | Color system (5 brand colors) |
| `/Users/abhay-ryze/Downloads/Union (1).svg` | Specter logo mark (SVG) |
| `product-requirements-document.md` | App structure and feature requirements |

---

## Notes for the Agent

- This is a **documentation task**, not a coding task. You are producing a markdown file.
- The brand gives you 5 colors. Expand this into a full semantic palette for a dark-mode content engine.
- **Clash Display** is the hero font (headlines, titles). **Manrope** is the workhorse (body, UI). **JetBrains Mono** for code.
- If commercial fonts aren't accessible, document free alternatives (Inter for Clash Display, Manrope is free on Google Fonts).
- **Tailwind v4** uses CSS-based config with `@theme` directive, NOT a JavaScript config file.
- Be opinionated. The brand guidelines give you colors and fonts. You design the spacing, component patterns, shadows, and animations to be consistent with Specter's "invisible intelligence" aesthetic: minimal, dark, geometric, clever.
- **Ghost Cyan (#068BD4)** is the new accent color. Use it for links, active states, focus rings, primary buttons.
- **True Black (#030712)** is darker than Cambrian's #141414. This is a bold, dramatic background.
- The logo uses negative space cleverly. This informs the design philosophy: clarity through subtraction, not addition.
- Don't include any Cambrian branding (amber accent, Die Grotesk fonts, Cambrian website references).

---

## Key Differences from Cambrian

| Aspect | Cambrian (OLD) | Specter (NEW) |
|--------|----------------|---------------|
| Display font | Die Grotesk A | Clash Display |
| Body font | Die Grotesk B | Manrope |
| Accent color | Amber (#E8B931) | Ghost Cyan (#068BD4) |
| Background | #141414 | True Black (#030712) |
| Philosophy | Warm, literary, amber-lit | Cool, technical, invisible intelligence |
| Brand mark | Geometric lettermark | Negative-space "S" |

The content engine is being rebranded from Cambrian (warm, amber, literary) to Specter (cool, cyan, technical intelligence).
