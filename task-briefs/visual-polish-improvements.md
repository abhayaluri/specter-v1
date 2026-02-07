# Visual Polish & Typography Improvements

**Status:** ✅ COMPLETE
**Priority:** HIGH (visual quality)
**Estimated effort:** 30-45 minutes
**Agent type:** Builder

---

## Context

After implementing the Specter rebrand (Task 1.5), the design is functional but lacks visual polish. The UI appears flat, monochromatic, and has weak typographic hierarchy. This task addresses 11 specific improvements to make the interface more dimensional, dynamic, and visually confident.

---

## Problems to Solve

### Visual Issues:
1. Sidebar blends into main content (no contrast)
2. Ghost Cyan accent color is completely absent
3. Cards are too flat (no depth or shadow)
4. No hover states or micro-interactions
5. Main heading lacks visual drama

### Typography Issues:
6. Body text too light (weight 300 → hard to read)
7. Heading weights too timid (h3/h4 at 500 should be 600)
8. Clash Display tracking not tight enough
9. "Specter" wordmark in sidebar too thin
10. Main heading size too small (32px → should be 48-56px)
11. Active nav items don't increase weight

---

## Files to Modify

1. `app/globals.css` — Typography weights, tracking, sizes
2. `app/layout.tsx` — Manrope font weights
3. `components/layout/Sidebar.tsx` — Wordmark, nav hover states, contrast
4. `app/page.tsx` — Main heading size, card styling
5. `components/layout/TopBar.tsx` — Verify contrast (if needed)

---

## Step-by-Step Implementation

### **PART 1: Fix Typography** (Most Critical)

#### 1.1 Update Manrope Font Weights in `app/layout.tsx`

**Problem:** Currently loading weight 300 (Light) which is too thin for UI text on dark backgrounds.

**OLD:**
```tsx
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '700'],
})
```

**NEW:**
```tsx
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600'], // Remove 300, add 500/600 for better hierarchy
})
```

---

#### 1.2 Update Typography Styles in `app/globals.css`

**Find this section in `@layer base`:**

**OLD:**
```css
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
```

**NEW (replace entire h1-h4 block):**
```css
h1 {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.03em; /* Tighter tracking for Clash Display */
}

h2 {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.025em; /* Add tight tracking */
}

h3 {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600; /* Increased from 500 */
  line-height: 1.2;
  letter-spacing: -0.02em; /* Add subtle tightness */
}

h4 {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600; /* Increased from 500 */
  line-height: 1.3;
  letter-spacing: -0.015em; /* Add tracking */
}
```

**Also add explicit base weight for body text (add after h4 block):**
```css
body {
  font-weight: 400; /* Ensure body text uses Regular, not Light */
}
```

---

### **PART 2: Fix Sidebar Visual Issues**

#### 2.1 Make "Specter" Wordmark Bolder in `components/layout/Sidebar.tsx`

**Find this line (~line 65):**

**OLD:**
```tsx
<h1 className="font-display text-lg tracking-tight text-foreground">
  Specter
</h1>
```

**NEW:**
```tsx
<h1 className="font-display text-xl font-semibold tracking-tight text-foreground">
  Specter
</h1>
```

---

#### 2.2 Add Ghost Cyan to Active Nav Items + Hover States

**Find the nav Link component (~line 77-91):**

**OLD:**
```tsx
<Link
  key={item.name}
  href={item.href}
  onClick={() => setMobileMenuOpen(false)}
  className={cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
  )}
>
  <item.icon className="w-5 h-5" />
  <span>{item.name}</span>
</Link>
```

**NEW (add font-medium on hover + improve transitions):**
```tsx
<Link
  key={item.name}
  href={item.href}
  onClick={() => setMobileMenuOpen(false)}
  className={cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200',
    isActive
      ? 'bg-primary/10 text-primary font-medium'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:font-medium'
  )}
>
  <item.icon className="w-5 h-5" />
  <span>{item.name}</span>
</Link>
```

**Key changes:**
- Add `font-medium` to active state
- Add `hover:font-medium` to inactive state
- Add `duration-200` for smoother transitions
- Remove redundant `font-medium` from base (let it change on state)

---

### **PART 3: Polish Dashboard (Main Content Area)**

#### 3.1 Increase Main Heading Size in `app/page.tsx`

**Find the main heading (~line 7-12):**

**OLD:**
```tsx
<h1 className="font-display text-[32px] tracking-tight text-foreground mb-6">
  Specter Content Engine
</h1>
<p className="text-muted-foreground text-sm mb-8">
  Invisible Intelligence
</p>
```

**NEW:**
```tsx
<h1 className="font-display text-5xl font-semibold tracking-tighter text-foreground mb-3">
  Specter Content Engine
</h1>
<p className="text-muted-foreground text-lg font-light tracking-wide mb-12">
  Invisible Intelligence
</p>
```

**Key changes:**
- `text-5xl` = 48px (was 32px) — much more dramatic
- `tracking-tighter` = -0.05em (tighter than tight)
- `mb-3` instead of `mb-6` — tighter spacing between heading and tagline
- Tagline: `text-lg` (was `text-sm`), `font-light`, `tracking-wide` — more elegant
- `mb-12` on tagline (more space before cards)

---

#### 3.2 Add Depth to Dashboard Cards

**Find the card grid (~line 14-26):**

**OLD:**
```tsx
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
```

**NEW (add shadows, hover states, better hierarchy):**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="p-6 bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:border-border-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-200">
    <h3 className="text-foreground font-semibold mb-2">Sources</h3>
    <p className="text-muted-foreground text-sm">Coming in Task 6</p>
  </div>
  <div className="p-6 bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:border-border-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-200">
    <h3 className="text-foreground font-semibold mb-2">Buckets</h3>
    <p className="text-muted-foreground text-sm">Coming in Task 7</p>
  </div>
  <div className="p-6 bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:border-border-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-200">
    <h3 className="text-foreground font-semibold mb-2">Drafts</h3>
    <p className="text-muted-foreground text-sm">Coming in Task 11</p>
  </div>
</div>
```

**Key changes:**
- `shadow-[0_1px_3px_rgba(0,0,0,0.4)]` — subtle shadow for depth
- `hover:border-border-light` — border brightens on hover
- `hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]` — shadow lifts on hover
- `transition-all duration-200` — smooth animation
- `font-semibold` on h3 headings (not just `font-medium`)

---

### **PART 4: Verify Sidebar Contrast** (Quick Check)

#### 4.1 Confirm Sidebar Background Color

Open `components/layout/Sidebar.tsx` and verify the sidebar div uses `bg-card`:

**Should be (~line 52-56):**
```tsx
<div
  className={cn(
    'w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-40',
    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
  )}
>
```

**If it says `bg-background` instead of `bg-card`, change it to `bg-card`.**

This ensures the sidebar is `#1F2937` (Charcoal) instead of `#030712` (True Black), creating visual separation.

---

### **PART 5: Optional — Add Subtle Animation to Logo**

If you want the Specter logo to have a subtle hover effect:

**In `components/layout/Sidebar.tsx`, find the logo img (~line 60-63):**

**OPTIONAL ENHANCEMENT:**
```tsx
<img
  src="/logo/specter-mark.svg"
  alt="Specter"
  className="w-8 h-8 invert transition-transform duration-300 hover:scale-110"
/>
```

This adds a subtle scale-up on hover (10% larger).

---

## Testing & Verification

After making all changes:

1. **Visual Check:**
   - [ ] Sidebar is visibly lighter than main content (charcoal vs black)
   - [ ] "Specter Content Engine" heading is large and dramatic (48px)
   - [ ] Navigation items show **Ghost Cyan** (`#068BD4`) when active
   - [ ] Navigation items get **bolder** on hover
   - [ ] Cards have subtle shadows and lift on hover
   - [ ] Card headings are bold (font-semibold, weight 600)
   - [ ] All body text is readable (weight 400, not 300)

2. **Typography Check (Browser DevTools):**
   - Inspect "Specter Content Engine" heading → should show:
     - `font-family: 'Clash Display'`
     - `font-size: 48px` (or `text-5xl`)
     - `letter-spacing: -0.05em` (or `tracking-tighter`)
   - Inspect nav items → should show:
     - `font-family: 'Manrope'`
     - `font-weight: 400` (inactive) or `500` (active/hover)
   - Inspect card headings → should show:
     - `font-family: 'Clash Display'`
     - `font-weight: 600`

3. **Interaction Check:**
   - [ ] Hover over nav items → text gets brighter + bolder + background changes
   - [ ] Hover over cards → border brightens + shadow lifts
   - [ ] Active nav item (e.g., Inbox) → cyan background glow + cyan text + bold
   - [ ] Logo hover (if optional enhancement added) → subtle scale-up

4. **TypeScript Check:**
   ```bash
   pnpm tsc --noEmit
   ```
   Should pass with no errors.

5. **Visual Regression Check:**
   - Compare before/after screenshots
   - Main differences should be:
     - Sidebar clearly separated from main content
     - Ghost Cyan accent visible on active nav
     - Larger, tighter main heading
     - Cards have depth/dimension
     - Typography feels crisper and more confident

---

## Before & After Summary

| Element | Before | After |
|---------|--------|-------|
| **Sidebar contrast** | Blends with background | Clearly separated (charcoal) |
| **Active nav color** | Gray | Ghost Cyan (#068BD4) |
| **Nav hover state** | Static gray | Bold + bright + bg change |
| **Main heading size** | 32px | 48px (text-5xl) |
| **Main heading tracking** | -0.02em | -0.05em (tighter) |
| **Body text weight** | 300 (too light) | 400 (readable) |
| **Card heading weight** | 500 (medium) | 600 (semibold) |
| **Card depth** | Flat | Subtle shadow + hover lift |
| **Clash Display tracking** | Standard | Tighter (-0.025em to -0.03em) |
| **"Specter" wordmark** | text-lg, normal | text-xl, semibold |

---

## Expected Outcome

A visually polished interface that:
- **Feels dimensional** (not flat) — shadows, hover states, depth
- **Has clear hierarchy** — bold headings, readable body text, dramatic hero
- **Uses the Ghost Cyan accent** — visible on active nav items
- **Feels confident and professional** — tight tracking, bold weights, dramatic sizing
- **Rewards interaction** — smooth hover states on nav + cards

The design should now match the "Invisible Intelligence" philosophy: **clarity through subtraction, but with purposeful emphasis where it matters.**

---

## Notes for Agent

- **Don't skip the typography fixes** — they're the most impactful changes
- **Test hover states** after implementation — they're critical for polish
- **If you see `font-medium` in base nav classes**, remove it (it should only appear in active/hover states)
- **The card shadow syntax** uses arbitrary values: `shadow-[0_1px_3px_rgba(0,0,0,0.4)]` — this is correct Tailwind v4 syntax
- **`tracking-tighter`** = `-0.05em` in Tailwind, which is perfect for Clash Display
- **The Ghost Cyan should be visible immediately** after nav item changes — if not, check that `--primary: #068BD4` is in globals.css

---

## Commit Message (After Completion)

```
Visual polish & typography improvements

Typography fixes:
- Increased heading weights (h3/h4: 500 → 600)
- Tightened Clash Display tracking (-0.03em on h1)
- Manrope font weights: removed 300, use 400 as base for readability
- Main heading size: 32px → 48px (text-5xl) with tracking-tighter
- "Specter" wordmark: text-lg → text-xl + semibold

Visual improvements:
- Ghost Cyan accent now visible on active nav items
- Nav hover states: text brightens + bolder + bg change
- Dashboard cards: added subtle shadows + hover lift + border brightens
- Card headings: font-medium → font-semibold
- Sidebar contrast verified (bg-card = charcoal)

Result: More dimensional, interactive, and typographically confident UI.
Matches "Invisible Intelligence" aesthetic with purposeful emphasis.
```
