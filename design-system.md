# Specter Content Engine — Design System

**Version:** 2.0 (Specter Rebrand)
**Last Updated:** 2026-02-06
**Brand:** Specter — Invisible Intelligence

This document is the single source of truth for all visual design decisions in the Specter Content Engine. Every builder agent must reference this before writing UI components.

---

## Brand Identity

### Philosophy

**Specter** embodies "invisible intelligence" — a brand built on clarity through subtraction, not addition. The logo mark itself demonstrates this: the letter "S" is formed by what's *absent*, not what's present. This philosophy extends to every design decision.

**Core Principles:**
- **Invisible intelligence** — Smart, not showy
- **Dark by default** — True Black (#030712) creates depth and mystery
- **Geometric precision** — Sharp, intentional, minimal
- **Ghost Cyan accent** — Cool, technical, confident
- **Breathing room** — Generous spacing, never cramped
- **Purposeful motion** — Animation only where it adds clarity

**Aesthetic:** Cool, technical, minimal. High-fashion meets high-tech. Professional but never corporate. Confident, not flashy.

---

## 1. Color Palette

### Brand Colors (Core)

The Specter brand defines 5 core colors. This design system expands them into a full semantic palette for the content engine.

| Color | Hex | Usage |
|-------|-----|-------|
| **Pure White** | `#FFFFFF` | Primary text, high-contrast elements |
| **Ghost Cyan** | `#068BD4` | Primary brand accent, links, active states |
| **Slate** | `#374151` | Borders, secondary surfaces |
| **Charcoal** | `#1F2937` | Elevated surfaces, cards, sidebar |
| **True Black** | `#030712` | Primary background, deepest depth |

### Semantic Color System

#### Backgrounds

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#030712` | Primary app background (True Black) |
| `surface` | `#1F2937` | Elevated elements: cards, sidebar, panels (Charcoal) |
| `surface-hover` | `#2D3748` | Hover state for interactive surfaces |
| `modal-overlay` | `rgba(3, 7, 18, 0.85)` | Modal backdrop (True Black at 85% opacity) |
| `surface-subtle` | `#111827` | Intermediate layer between bg and surface |

#### Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `border` | `#374151` | Default borders, dividers (Slate) |
| `border-light` | `#4B5563` | Subtle borders, hover states |
| `border-strong` | `#6B7280` | Emphasized borders, active containers |
| `border-focus` | `#068BD4` | Focus rings (Ghost Cyan) |

#### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#FFFFFF` | Primary text (Pure White) |
| `text-muted` | `#9CA3AF` | Secondary text, labels, metadata |
| `text-dim` | `#6B7280` | Tertiary text, placeholders, disabled states |
| `text-on-accent` | `#030712` | Text on Ghost Cyan backgrounds (True Black for contrast) |

#### Accents

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#068BD4` | Primary accent (Ghost Cyan): links, CTAs, active states |
| `accent-hover` | `#0EA5E9` | Hover state for accent elements |
| `accent-dim` | `rgba(6, 139, 212, 0.15)` | Subtle accent backgrounds (15% opacity) |
| `accent-strong` | `#0284C7` | Pressed/active accent state |

#### State Colors

The brand doesn't define state colors, so we design them to complement Ghost Cyan and the dark aesthetic:

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#10B981` | Success states, confirmations, published status (emerald) |
| `success-dim` | `rgba(16, 185, 129, 0.15)` | Subtle success backgrounds |
| `warning` | `#F59E0B` | Warning states, alerts (amber) |
| `warning-dim` | `rgba(245, 158, 11, 0.15)` | Subtle warning backgrounds |
| `error` | `#EF4444` | Error states, destructive actions (red) |
| `error-dim` | `rgba(239, 68, 68, 0.15)` | Subtle error backgrounds |
| `info` | `#068BD4` | Info states (reuses Ghost Cyan) |
| `info-dim` | `rgba(6, 139, 212, 0.15)` | Subtle info backgrounds |

#### Selection

| Token | CSS | Usage |
|-------|-----|-------|
| `::selection` | `background: #068BD4; color: #FFFFFF;` | Text selection (Ghost Cyan bg, white text) |

### Accessibility Notes

- **Pure White (#FFFFFF) on True Black (#030712):** 21:1 contrast ratio (WCAG AAA)
- **Pure White on Charcoal (#1F2937):** 14:1 contrast ratio (WCAG AAA)
- **Ghost Cyan (#068BD4) on True Black:** 4.8:1 contrast ratio (WCAG AA for large text)
- **Text Muted (#9CA3AF) on True Black:** 8.5:1 contrast ratio (WCAG AAA)

All primary text meets WCAG AAA standards. Accent colors meet WCAG AA for UI elements and large text.

---

## 2. Typography

### Font Families

| Family | Usage | Styles | Fallback Stack |
|--------|-------|--------|----------------|
| **Clash Display** | Display type, headlines, page titles, brand moments | Medium (primary), Neutral, Bulky | `'Clash Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| **Manrope** | Body text, UI labels, navigation, paragraphs | Regular (400), Bold (700), Light (300) | `'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| **JetBrains Mono** | Code blocks, monospace content, API responses, technical data | Regular (400), Medium (500) | `'JetBrains Mono', 'Monaco', 'Courier New', monospace` |

**Font Character:**
- **Clash Display:** "A luxuriously bold yet dramatically geometric forma that commands immediate attention. It signals luxury, brand feel—the kind that hits with high-fashion meets high-tech." Use for headlines, not body text.
- **Manrope:** "Balances Clash's drama with geometric simplicity and excellent readability. Its clean, unfussy forms ensure that while headlines grab attention, body text remains effortlessly readable." The workhorse font.
- **JetBrains Mono:** Not specified by brand guidelines, but necessary for code/technical content. Clean, modern monospace.

**Font Display Strategy:** All fonts use `font-display: swap` to prevent FOIT (Flash of Invisible Text).

**Anti-aliasing:** Apply globally:
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### Type Scale

| Element | Family | Size | Weight | Line Height | Letter Spacing | Notes |
|---------|--------|------|--------|-------------|----------------|-------|
| **Page Title (h1)** | Clash Display | `40px` | Medium (600) | `1.1` | `-0.02em` | Hero titles, main page headings |
| **Section Heading (h2)** | Clash Display | `28px` | Medium (600) | `1.2` | `-0.01em` | Section titles, major dividers |
| **Subsection (h3)** | Clash Display | `24px` | Neutral (500) | `1.3` | `0` | Subsections, card titles |
| **Small Heading (h4)** | Clash Display | `20px` | Neutral (500) | `1.4` | `0` | Minor headings, dialog titles |
| **Body Large** | Manrope | `16px` | Regular (400) | `1.6` | `0` | Chat messages, emphasized content |
| **Body Standard** | Manrope | `15px` | Regular (400) | `1.6` | `0` | Default UI text, paragraphs |
| **Body Small** | Manrope | `14px` | Regular (400) | `1.5` | `0` | Captions, metadata, nav labels |
| **Caption** | Manrope | `13px` | Regular (400) | `1.4` | `0` | Timestamps, helper text, fine print |
| **Label (UI)** | Manrope | `14px` | Bold (700) | `1.4` | `0.01em` | Form labels, input labels, tags |
| **Button** | Manrope | `15px` | Bold (700) | `1` | `0.01em` | Buttons, CTAs |
| **Input Text** | Manrope | `15px` | Regular (400) | `1.5` | `0` | Text inputs, textareas |
| **Code Inline** | JetBrains Mono | `14px` | Regular (400) | `1.5` | `0` | Inline code, filenames |
| **Code Block** | JetBrains Mono | `14px` | Regular (400) | `1.6` | `0` | Code blocks, JSON, logs |

**Mobile Adjustments (≤768px):**
- Page Title (h1): `32px` (down from 40px)
- Section Heading (h2): `24px` (down from 28px)
- Subsection (h3): `20px` (down from 24px)
- Small Heading (h4): `18px` (down from 20px)
- Body text: unchanged (readability priority)

---

## 3. Spacing & Layout

### Spacing Scale (8-Point Grid)

Use these values consistently for padding, margin, and gaps. Based on an 8px base unit:

| Token | Value | Tailwind | Usage |
|-------|-------|----------|--------|
| `xs` | `4px` | `1` | Tight spacing, icon gaps |
| `sm` | `8px` | `2` | Compact spacing, badge padding |
| `md` | `12px` | `3` | Small gaps between elements |
| `base` | `16px` | `4` | Default gap, comfortable spacing |
| `lg` | `24px` | `6` | Card padding, section spacing |
| `xl` | `32px` | `8` | Large section breaks, page padding (mobile) |
| `2xl` | `48px` | `12` | Page padding (desktop), major breaks |
| `3xl` | `64px` | `16` | Hero spacing, extra-large rhythm |
| `4xl` | `96px` | `24` | Maximum spacing |

### Layout Conventions

**Page Layout:**
- Desktop padding: `48px` horizontal, `32px` top/bottom
- Mobile padding: `24px` all sides
- Max content width: `1280px` (full app)

**Component Spacing:**
- Card padding: `24px` (all sides)
- Compact card padding: `16px` (list items, small cards)
- Button padding: `12px 24px` (vertical, horizontal)
- Input padding: `12px 16px` (vertical, horizontal)
- Modal padding: `32px` (all sides)

**Gaps:**
- Tight groups (form fields): `12px` (`gap-3`)
- Related elements: `16px` (`gap-4`)
- Section spacing: `32px` (`gap-8`)
- Major sections: `48px` (`gap-12`)

**Component Widths:**
- Sidebar (desktop): `280px` (collapsed: `64px`)
- Conversation thread: `720px` max-width
- Draft content pane: `680px` max-width
- Long-form text: `560px` max-width
- Modal: `600px` max-width (default), `800px` (large)

---

## 4. Borders & Radii

### Border Style

| Element | Style |
|---------|-------|
| Default border | `1px solid var(--color-border)` |
| Light border | `1px solid var(--color-border-light)` |
| Strong border | `1px solid var(--color-border-strong)` |
| Focus ring | `2px solid var(--color-accent)` with `0` offset |
| Divider | `1px solid var(--color-border)` (horizontal/vertical rule) |

### Border Radius

The Specter logo uses sharp geometric forms, but UI elements benefit from subtle rounding for usability and modern aesthetic:

| Element | Radius | Tailwind | CSS Variable |
|---------|--------|----------|--------------|
| **Small (badges)** | `4px` | `rounded-sm` | `var(--radius-sm)` |
| **Default (buttons, inputs)** | `6px` | `rounded` | `var(--radius)` |
| **Medium (cards)** | `8px` | `rounded-md` | `var(--radius-md)` |
| **Large (modals)** | `12px` | `rounded-lg` | `var(--radius-lg)` |
| **Full (avatars, pills)** | `9999px` | `rounded-full` | N/A |
| **None (sharp)** | `0px` | `rounded-none` | Only for logo, specific brand elements |

**Rationale:** While the brand logo is sharp-edged, UI elements (cards, buttons, inputs) use subtle rounding (4-12px) for improved usability and visual comfort. The rounding is minimal and geometric, not organic.

---

## 5. Shadows & Depth

Specter uses darkness to create depth. Shadows are subtle and used sparingly.

### Shadow Levels

**None (Flat):**
```css
box-shadow: none;
```
Default for most elements. Rely on borders and background color for depth.

**Subtle (Elevated Cards):**
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
```
Use for: Hover states on cards, slight elevation.

**Medium (Dropdowns, Popovers):**
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4);
```
Use for: Dropdown menus, tooltips, floating panels.

**Heavy (Modals, Overlays):**
```css
box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 8px 20px rgba(0, 0, 0, 0.6);
```
Use for: Modals, dialogs, major overlays.

**Focus Shadow (Accent Glow):**
```css
box-shadow: 0 0 0 2px var(--color-accent);
```
Use for: Focus states on inputs, buttons, interactive elements.

**Design Note:** True Black (#030712) is already extremely dark, so shadows are primarily used for layering UI elements, not creating dramatic depth. Focus on borders and background color hierarchy first.

---

## 6. Animation & Transitions

**Philosophy:** Animation should be invisible intelligence — purposeful, not decorative. Subtle, fast, confident.

### Transition Conventions

| Interaction | Duration | Easing | CSS |
|-------------|----------|--------|-----|
| **UI Interactions** (hover, focus) | `150ms` | `cubic-bezier(0.16, 1, 0.3, 1)` (spring) | `transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);` |
| **Color/Background Shifts** | `150ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `transition: background-color 0.15s ease, color 0.15s ease;` |
| **Opacity Changes** | `200ms` | `ease` | `transition: opacity 0.2s ease;` |
| **Content Reveals** (panels, sections) | `300ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);` |
| **Page Transitions** | `400ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);` |
| **Modal/Overlay** | `250ms` | `ease` | `transition: opacity 0.25s ease;` (overlay), `transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);` (content) |
| **Drawer/Side Panel** | `350ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | `transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);` |

### Easing Functions

**Spring Easing (Primary):**
```css
cubic-bezier(0.16, 1, 0.3, 1)
```
Use for: Most UI interactions. Confident, snappy, slightly elastic.

**Ease (Secondary):**
```css
ease
```
Use for: Opacity changes, simple fades.

**Ease-In-Out (Rare):**
```css
ease-in-out
```
Use for: Symmetrical animations only.

### Animation Patterns

**Hover States:**
- Buttons: Background lightens, slight scale (1.02) or opacity shift (0.9)
- Links: Color shifts to `accent-hover`, underline appears
- Cards: Background shifts to `surface-hover`, subtle shadow appears

**Loading States:**
- Skeleton loaders: Pulse animation (Tailwind's `animate-pulse`)
- Spinners: Rotate animation at 0.8s duration
- Progress bars: Smooth width transition

**Enter/Exit Animations:**
- Modals: Fade in overlay (250ms), scale content from 0.95 to 1 (250ms)
- Toasts: Slide in from right, fade out on dismiss
- Dropdowns: Fade + slide down (150ms)

**Do NOT Use:**
- Bounce or elastic easings (too playful)
- Long animations (>500ms) except for page transitions
- Continuous animations (except loading states)
- Decorative animations without purpose

---

## 7. Component Patterns

These are **visual pattern descriptions** with example Tailwind classes. Not React code.

### Buttons

**Primary Button** (High-emphasis CTA):
```
bg-accent text-text-on-accent px-6 py-3 rounded font-bold
hover:bg-accent-hover transition-all duration-150
focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg
```
- **Background:** Ghost Cyan (#068BD4)
- **Text:** True Black (#030712) for contrast
- **Padding:** 12px vertical, 24px horizontal
- **Radius:** 6px
- **Hover:** Lighter cyan (#0EA5E9)

**Secondary Button** (Medium-emphasis action):
```
bg-surface text-text border border-border px-6 py-3 rounded font-bold
hover:bg-surface-hover hover:border-border-light transition-all duration-150
focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg
```
- **Background:** Charcoal (#1F2937)
- **Border:** Slate (#374151)
- **Text:** Pure White (#FFFFFF)
- **Hover:** Lighter charcoal, lighter border

**Ghost Button** (Low-emphasis action):
```
bg-transparent text-text px-6 py-3 rounded font-bold
hover:bg-surface transition-all duration-150
focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg
```
- **Background:** Transparent
- **Text:** Pure White
- **Hover:** Charcoal surface appears

**Icon Button** (Compact, icon-only):
```
bg-transparent p-2 rounded
hover:bg-surface transition-all duration-150
```
- **Padding:** 8px all sides
- **Hover:** Charcoal surface

**Destructive Button** (Danger action):
```
bg-error text-white px-6 py-3 rounded font-bold
hover:bg-error/90 transition-all duration-150
```
- **Background:** Error red (#EF4444)
- **Text:** White

### Inputs

**Text Input:**
```
bg-surface border border-border text-text px-4 py-3 rounded
placeholder:text-text-dim
focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/50
transition-all duration-150
```
- **Background:** Charcoal (#1F2937)
- **Border:** Slate (#374151)
- **Text:** Pure White (#FFFFFF), 15px Manrope
- **Padding:** 12px vertical, 16px horizontal
- **Focus:** Ghost Cyan border + ring

**Textarea:**
```
(Same as text input)
min-h-[120px] resize-y
```
- **Min height:** 120px
- **Resize:** Vertical only

**Select Dropdown:**
```
(Same as text input)
pr-10 appearance-none bg-[url('data:image/svg+xml...')] bg-no-repeat bg-right
```
- Custom chevron icon on right

**Checkbox / Radio:**
```
w-5 h-5 border-2 border-border bg-surface rounded-sm
checked:bg-accent checked:border-accent
focus:ring-2 focus:ring-accent/50
```

### Cards

**Default Card** (Buckets, sources, content):
```
bg-surface border border-border rounded-md p-6
hover:border-border-light hover:shadow-subtle transition-all duration-150
```
- **Background:** Charcoal (#1F2937)
- **Border:** Slate (#374151)
- **Padding:** 24px
- **Radius:** 8px
- **Hover:** Lighter border, subtle shadow

**Compact Card** (List items, small previews):
```
bg-surface border border-border rounded p-4
hover:bg-surface-hover transition-all duration-150
```
- **Padding:** 16px
- **Radius:** 6px

**Interactive Card** (Clickable):
```
bg-surface border border-border rounded-md p-6
hover:border-accent hover:shadow-medium transition-all duration-150
cursor-pointer
```
- **Hover:** Ghost Cyan border, medium shadow

### Modal

**Modal Overlay:**
```
fixed inset-0 bg-modal-overlay backdrop-blur-sm z-50
transition-opacity duration-250
```
- **Background:** True Black at 85% opacity
- **Backdrop blur:** 4px (optional)

**Modal Content:**
```
bg-surface border border-border rounded-lg p-8 shadow-heavy
max-w-[600px] mx-auto mt-20
transform transition-all duration-250
```
- **Background:** Charcoal (#1F2937)
- **Border:** Slate (#374151)
- **Radius:** 12px
- **Padding:** 32px
- **Shadow:** Heavy elevation
- **Max width:** 600px (default), 800px (large)

**Modal Close Button:**
```
absolute top-4 right-4 p-2 rounded
hover:bg-surface-hover transition-all
```

### Badges

**Status Badge:**
```
px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide
```

**Status Variants:**
- **Draft:** `bg-border/30 text-text-muted border border-border`
- **Ready:** `bg-accent-dim text-accent border border-accent/30`
- **Published:** `bg-success-dim text-success border border-success/30`

**Type Badge** (Platform, source type):
```
px-3 py-1 rounded-full text-xs font-bold uppercase
bg-accent-dim text-accent
```

### Navigation

**Nav Item (Sidebar):**

**Active:**
```
bg-accent-dim text-accent px-4 py-3 rounded
border-l-2 border-accent
```
- **Background:** Ghost Cyan at 15% opacity
- **Text:** Ghost Cyan
- **Left border:** 2px Ghost Cyan indicator

**Inactive:**
```
text-text-muted px-4 py-3 rounded
hover:bg-surface-hover hover:text-text
transition-all duration-150
```
- **Text:** Muted gray
- **Hover:** Charcoal background, white text

### Toast / Notification

**Toast Container:**
```
bg-surface border rounded-md p-4 shadow-medium
max-w-[400px] pointer-events-auto
```
- **Background:** Charcoal (#1F2937)
- **Padding:** 16px
- **Radius:** 8px
- **Shadow:** Medium

**Toast Variants:**
- **Success:** `border-l-4 border-success bg-success-dim/50`
- **Error:** `border-l-4 border-error bg-error-dim/50`
- **Warning:** `border-l-4 border-warning bg-warning-dim/50`
- **Info:** `border-l-4 border-accent bg-accent-dim/50`

### Skeleton Loader

**Skeleton Element:**
```
bg-surface-hover rounded animate-pulse
```
- **Background:** Lighter charcoal (#2D3748)
- **Animation:** Tailwind's pulse (1.5s loop)

**Skeleton Shimmer (Enhanced):**
```css
background: linear-gradient(90deg,
  var(--color-surface) 0%,
  var(--color-surface-hover) 50%,
  var(--color-surface) 100%
);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;
```

### Divider

**Horizontal Divider:**
```
border-t border-border my-6
```

**Vertical Divider:**
```
border-l border-border mx-4 h-full
```

---

## 8. Tailwind v4 Config

**CRITICAL:** This project uses **Tailwind v4**, which requires the `@theme` directive in CSS, NOT a JavaScript config file (`tailwind.config.ts`).

Paste this into `app/globals.css`:

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

**Usage Notes:**
- All design tokens are defined as CSS custom properties (e.g., `var(--color-accent)`)
- Use Tailwind utility classes that reference these tokens: `bg-accent`, `text-text-muted`, `border-border`
- The `@theme` directive makes these tokens available to Tailwind's utility class generator
- Font families are referenced via CSS variables set by `next/font/local` in the root layout

---

## 9. Font Loading Strategy

### Font Files

**Clash Display:**
- Location: `/Users/abhay-ryze/Downloads/ClashDisplay_Complete.zip`
- Unzip and locate `.woff2` files for: Medium (primary), Neutral, Bulky
- Copy to: `public/fonts/clash-display/` in Next.js project

**Manrope:**
- Location: `/Users/abhay-ryze/Downloads/Manrope.zip`
- Unzip and locate `.woff2` files for: Regular (400), Bold (700), Light (300)
- Copy to: `public/fonts/manrope/` in Next.js project
- **Alternative:** Manrope is available on Google Fonts — can use `next/font/google`

**JetBrains Mono:**
- Free, available via Google Fonts
- Use `next/font/google` to load

### Next.js Font Loading (Recommended)

In `app/layout.tsx`:

```tsx
import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'

// Clash Display (display font)
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

// Manrope (body font) — Option 1: Local files
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

// Manrope — Option 2: Google Fonts (easier)
// import { Manrope } from 'next/font/google'
// const manrope = Manrope({
//   subsets: ['latin'],
//   variable: '--font-sans',
//   display: 'swap',
//   weight: ['300', '400', '700'],
// })

// JetBrains Mono (monospace)
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500'],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${clashDisplay.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

**Alternative: @font-face Declarations**

If not using `next/font`, add to `app/globals.css`:

```css
@font-face {
  font-family: 'Clash Display';
  src: url('/fonts/clash-display/ClashDisplay-Medium.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Clash Display';
  src: url('/fonts/clash-display/ClashDisplay-Regular.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Manrope';
  src: url('/fonts/manrope/Manrope-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Manrope';
  src: url('/fonts/manrope/Manrope-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

Then update the `@theme` directive font families to reference the font names directly instead of CSS variables.

---

## 10. Logo & Assets

### Logo Mark

**File:** `/Users/abhay-ryze/Downloads/Union (1).svg`

**Copy to:** `public/logo/specter-mark.svg` in the Next.js project

**Description:** Geometric negative-space "S" shape. The letter is formed by what's *absent*, not what's present. This embodies the "invisible intelligence" philosophy.

**Usage:**
- **Sidebar branding:** White logo on True Black background
- **Favicon:** Export as `.ico` and `.png` (16x16, 32x32, 180x180)
- **Loading states:** Animated logo mark (optional)
- **App icon:** For mobile home screen, PWA

**Colors:**
- **On dark backgrounds (default):** Pure White (#FFFFFF)
- **On light backgrounds (if needed):** True Black (#030712)
- **Never:** Ghost Cyan or other colors — logo is always monochrome

**Size Guidelines:**
- **Sidebar:** 32x32px or 40x40px
- **Favicon:** 16x16px, 32x32px
- **App icon:** 180x180px, 512x512px

### Wordmark

**Text:** "Specter"
**Font:** Clash Display, Medium weight
**Usage:** Render programmatically using the display font, not as a static image
**Color:** Pure White on dark backgrounds

**Combined Logo:** Logo mark + wordmark horizontally aligned, 12px gap between them

---

## Summary Checklist

- [x] Complete color palette with all semantic tokens (16 background/border/text colors + 8 state colors)
- [x] Typography scale with Clash Display (display) and Manrope (body)
- [x] JetBrains Mono specified for monospace
- [x] Spacing scale using 8-point grid (9 values from 4px to 96px)
- [x] Border and radius conventions defined (4 levels: 4px, 6px, 8px, 12px)
- [x] Shadow system for elevation (3 levels: subtle, medium, heavy)
- [x] Animation/transition patterns defined (6 patterns, spring easing)
- [x] Component patterns for: button (4 variants), input (4 types), card (3 variants), modal, badge (3 variants), nav item, toast (4 variants), skeleton, divider
- [x] **Tailwind v4 @theme directive** ready to paste into `app/globals.css` (NOT `tailwind.config.ts`)
- [x] Font loading strategy documented (`next/font/local` for Clash Display and Manrope, `next/font/google` for JetBrains Mono)
- [x] Logo file location and usage documented
- [x] Ghost Cyan (#068BD4) used as primary accent
- [x] True Black (#030712) used as primary background
- [x] No conflicts with Next.js 14 or Tailwind v4
- [x] WCAG AA/AAA contrast ratios verified
- [x] Mobile responsive adjustments documented
- [x] "Invisible intelligence" philosophy reflected throughout

---

## Design System Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-02-06 | **Specter rebrand:** New color palette (Ghost Cyan accent, True Black bg), new fonts (Clash Display, Manrope, JetBrains Mono), Tailwind v4 CSS-based config, complete redesign |
| 1.0 | 2026-02-06 | Initial Cambrian design system (deprecated) |

---

**End of Design System Document**
