# Task 0 — Design System Extraction

**Status:** NOT STARTED
**Dependencies:** None
**Agent type:** Research + Documentation
**Estimated effort:** 1 agent session

---

## Objective

Study the Cambrian website (`cambrian website v1/`) and the existing design specs across project docs. Produce a comprehensive `design-system.md` that every subsequent builder agent references for UI work.

This is a **documentation task, not a coding task.** You are extracting design tokens, not building components.

---

## Before You Start

Read these files in order:

1. `cambrian website v1/index.html` — The Cambrian website. Contains all CSS, font declarations, color values, spacing, animation patterns. **This is your primary reference.**
2. `product-requirements-document.md` → "Design Direction" section (near the end)
3. `claude-code-agent-instructions.md` → "Tailwind Theme" section

The website HTML is the source of truth for the visual language. The PRD and CLAUDE.md have some design tokens that may need reconciliation — trust the website over the docs where they conflict.

---

## What to Extract

### 1. Color Palette

Extract every color from the website CSS and map them to semantic names for the content engine.

**From the website:**
- Background: `#141414`
- Primary text: `#ffffff`
- Muted text: `#8E8E8E`
- Selection: `background: #ffffff; color: #141414` (inverted)
- Overlay: `rgba(0, 0, 0, 0.7)`

**From the PRD (content engine specific — not on the website):**
- Surface: `#161616`
- Surface hover: `#1E1E1E`
- Border: `#2A2A2A`
- Border light: `#333333`
- Text: `#E8E6E3` (warm off-white — PRD uses this instead of pure white)
- Text muted: `#8A8A8A`
- Text dim: `#5A5A5A`
- Accent: `#E8B931` (gold/amber — Cambrian brand color)
- Accent dim: `#E8B93122`
- Danger: `#D4594E`
- Success: `#4A9B6F`

**Your job:** Reconcile these into one unified palette. The website's `#141414` bg vs the PRD's `#0D0D0D` is a known discrepancy — **use `#141414`** (the website value) as the primary background. The content engine needs more surface levels than the website (it has cards, panels, modals), so the PRD's surface hierarchy is additive.

Document each color with:
- Hex value
- Semantic name (e.g., `bg`, `surface`, `text-muted`)
- Where it's used (backgrounds, text, borders, accents)

### 2. Typography

**Fonts (RESOLVED — do not change):**
- **Die Grotesk A** — Display/headings. File: `assets/fonts/test-die-grotesk-a-regular.woff2`
- **Die Grotesk B** — Body/UI text. File: `assets/fonts/test-die-grotesk-vf-roman.woff2` (this is a variable font)
- **IBM Plex Mono** — Code/monospace. Loaded from Google Fonts or npm package.

**From the website, extract the full type scale:**

| Element | Font Family | Size | Weight | Other |
|---------|------------|------|--------|-------|
| Body | Die Grotesk B | 16px (base) | 400 | line-height: 1 |
| Wordmark/Hero | Die Grotesk A | 32px | 400 | letter-spacing: -0.05em |
| Info link / nav | Die Grotesk B | 14px | 400 | text-underline-offset: 4px |
| Header/footer metadata | Die Grotesk B | 14px | 400 | tabular-nums, uppercase |
| Paragraph text | Die Grotesk B | 15px | 400 | line-height: 1.8 |
| Mobile header/footer | Die Grotesk B | 11-12px | 400 | uppercase |

**Your job:** Expand this into a full type scale for the content engine:
- Page headings (h1-h3)
- Section headings
- Body text (standard, small)
- UI labels / captions
- Code / monospace
- Button text
- Input text

Note: Die Grotesk A is only used for display/headings. Die Grotesk B is the workhorse for everything else. IBM Plex Mono for any code or monospaced content.

### 3. Spacing & Layout

**From the website:**
- Header padding: `48px` (desktop), `32px 24px` (mobile)
- Footer padding: `32px 48px` (desktop), `24px` (mobile)
- Main content padding: `0 24px`
- Logo margin-bottom: `24px`
- Paragraph margin-bottom: `24px`
- Max content width: `520px` (info page)

**Your job:** Define a spacing scale for the content engine:
- Page padding (desktop vs mobile)
- Card padding
- Section spacing
- Component gaps (between elements in a group)
- Input/button padding

### 4. Borders & Radii

The website uses no visible border-radius — everything is sharp-cornered. The PRD defines:
- Border color: `#2A2A2A`
- Border light: `#333333`

**Your job:** Define border conventions:
- Default border style
- Card borders
- Input borders (default, focus, error)
- Divider style
- Border radius (recommend a small default, e.g., `4px` or `6px` for the content engine UI even though the website is sharp — cards and inputs benefit from slight rounding)

### 5. Animation & Transitions

**From the website:**
- Link hover: `opacity 0.2s ease` → `opacity: 0.7`
- Content hide: `opacity 0.4s ease, transform 0.4s ease`
- Info page reveal: `transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)` (spring easing)
- Overlay: `opacity 0.5s ease`
- GSAP loading sequence: `power2.out` and `power3.out` easings
- Header/footer: `opacity 0.4s ease`

**Your job:** Define transition conventions for the content engine:
- Default transition (for hover states, color changes)
- Content reveals (for page transitions, modal opens)
- Streaming text appearance
- Don't use GSAP — these translate to CSS transitions and Tailwind's `transition-*` classes

### 6. Component Patterns

Define visual patterns for the following components (description + Tailwind classes, not React code):

- **Button** — Primary (accent bg), secondary (surface bg, border), ghost (transparent)
- **Input** — Text input, textarea. Dark surface, border, focus ring.
- **Card** — Surface bg, border, padding. Used for buckets, sources, drafts.
- **Modal** — Overlay + centered card. Close button.
- **Badge** — Small pill for status (draft/ready/published), source type, platform.
- **Nav item** — Active vs inactive states.
- **Toast/notification** — Success, error, info variants.
- **Skeleton** — Loading placeholder.

### 7. Tailwind Config

Produce a ready-to-paste `tailwind.config.ts` theme extension that includes:
- All colors from the palette
- Font family definitions (with fallback stacks)
- Any custom spacing if needed
- Border radius defaults
- Any custom animations

**Important:** The font loading itself (CSS `@font-face` declarations) should be documented separately since that goes in `app/globals.css`, not `tailwind.config.ts`.

### 8. Font Loading Strategy

Document exactly how to load the fonts in a Next.js 14 App Router project:
- Die Grotesk A and B are local `.woff2` files (copy from `cambrian website v1/assets/fonts/`)
- Where to put the font files in the Next.js project (`public/fonts/` or using `next/font/local`)
- The `@font-face` declarations or `next/font` configuration
- IBM Plex Mono can be loaded via `next/font/google` or the npm package `@ibm/plex`
- Anti-aliasing: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`

---

## Output

Create a single file: `design-system.md` in the project root (`/Users/abhay-ryze/Desktop/Cambrian/Cambrian Content Engine V1/design-system.md`).

Structure it with clear sections matching the items above. Include:
- Hex values and semantic names for every color
- Complete type scale table
- Spacing scale
- Component pattern descriptions with suggested Tailwind classes
- Ready-to-paste `tailwind.config.ts` extension
- Font loading instructions

---

## Acceptance Criteria

- [ ] Complete color palette with hex values, semantic names, and usage notes
- [ ] Typography scale: font families, sizes, weights, line heights for all use cases
- [ ] Spacing and layout conventions (desktop + mobile)
- [ ] Border and radius conventions
- [ ] Animation/transition conventions
- [ ] Component style patterns for at least: button, input, card, modal, badge, nav item, toast, skeleton
- [ ] Ready-to-paste `tailwind.config.ts` theme extension
- [ ] Font files identified and loading strategy documented (local woff2 + IBM Plex Mono)
- [ ] Background color reconciled: uses `#141414` from the website (not `#0D0D0D`)
- [ ] No conflicts between the design system and existing PRD/CLAUDE.md design specs

---

## Reference Files

| File | What to look at |
|------|----------------|
| `cambrian website v1/index.html` | Full CSS (lines 24-456), font-face declarations, color values, spacing, transitions |
| `cambrian website v1/assets/fonts/` | Available font files: `test-die-grotesk-a-regular.woff2`, `test-die-grotesk-vf-roman.woff2` |
| `product-requirements-document.md` | "Design Direction" section — colors, font refs, spacing, animation |
| `claude-code-agent-instructions.md` | "Tailwind Theme" section — existing color tokens and font config |

---

## Notes for the Agent

- This is a documentation task. You are producing a markdown file, not writing React components.
- Be opinionated. Where the website doesn't specify something the content engine needs (e.g., card styles, input focus rings), design it to be consistent with the existing aesthetic: dark, minimal, generous spacing, amber accent.
- The CLAUDE.md Tailwind theme section already has a partial config. Your design system should be the authoritative, expanded version. If they conflict, your version wins (and builder agents will update CLAUDE.md accordingly).
- Don't include WebGL, Three.js, or GSAP patterns — those are website-specific, not relevant to the content engine.
