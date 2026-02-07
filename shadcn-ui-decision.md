# Decision Document: Should We Add shadcn/ui Component Library?

**Date:** 2026-02-06
**Context:** After completing Task 4 (Layout Shell & Navigation)
**Decision Owner:** Orchestrator Agent + Team (Abhay + Srikar)
**Status:** ⏳ PENDING DECISION

---

## Executive Summary

**Question:** Should we add shadcn/ui component library to the Cambrian Content Engine project?

**Current State:** Using custom components built from scratch with Tailwind CSS v4

**Recommendation:** **YES, add shadcn/ui** — but consider Tailwind v3 compatibility approach

**Key Consideration:** Tailwind v4 compatibility is the main technical blocker

---

## Current Project State

### What We Have Now (Task 4 Complete)
- ✅ Custom layout components (AppShell, Sidebar, TopBar)
- ✅ Inline SVG icons (no icon library)
- ✅ Tailwind CSS v4 with CSS-based `@theme` config
- ✅ Design tokens in `app/globals.css`
- ✅ `cn()` utility (clsx + tailwind-merge)
- ✅ No component library dependencies

### Current Dependencies
```json
{
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.4.0",
  "tailwindcss": "^4"
}
```

### Design System Tokens (globals.css)
- `--color-bg: #141414`
- `--color-surface: #161616`
- `--color-accent: #e8b931`
- `--color-text: #e8e6e3`
- `--color-text-muted: #8a8a8a`
- Plus border, radius, font variables

---

## What Is shadcn/ui?

**Not a traditional component library** - It's a collection of:
- Re-usable components built on Radix UI primitives
- Copy-paste into your project (you own the code)
- Styled with Tailwind CSS
- TypeScript-first
- Excellent accessibility built-in

**Key Difference:** You don't `npm install shadcn-ui`. Instead:
```bash
npx shadcn@latest init  # Setup
npx shadcn@latest add button  # Copy individual components
```

Components go into `components/ui/` directory as YOUR code.

---

## Upcoming Component Needs (Tasks 5-11)

### Task 5: Settings UI (Profile & Preferences)
**Needs:**
- ✓ Form components (labels, inputs, textareas)
- ✓ Switch/Toggle components (enable/disable features)
- ✓ Select menus (model selection: Opus/Sonnet/Haiku)
- ✓ Tabs (organize settings sections)
- ✓ Button variants

**shadcn provides:** Form, Switch, Select, Tabs, Button, Label, Input, Textarea

### Task 6: Source Capture (Inbox)
**Needs:**
- ✓ Dialog/Modal (add new source)
- ✓ Form validation
- ✓ Textarea with auto-resize
- ✓ Dropdown menu (source type selection)
- ✓ Toast notifications (success/error feedback)

**shadcn provides:** Dialog, Form, Textarea, Dropdown Menu, Toast

### Task 7: Bucket Management
**Needs:**
- ✓ Dialog (create/edit bucket)
- ✓ Dropdown menu (bucket actions)
- ✓ Popover (color picker)
- ✓ Alert Dialog (delete confirmation)
- ✓ Badge components (bucket colors)

**shadcn provides:** Dialog, Dropdown Menu, Popover, Alert Dialog, Badge

### Task 8a/8b/8c: Conversation Features
**Needs:**
- ✓ Select menus (bucket selection, platform selection)
- ✓ Radio group (mode selection: Explore vs Draft)
- ✓ Checkbox (include all buckets toggle)

**shadcn provides:** Select, Radio Group, Checkbox

### Task 9: Chat UI (Explore/Draft Conversations)
**Needs:**
- ✓ Scroll area (message list)
- ✓ Tooltip (explain features)
- ✓ Textarea (message input)
- ✓ Loading states (skeleton)

**shadcn provides:** Scroll Area, Tooltip, Textarea, Skeleton

### Task 11: Draft Management
**Needs:**
- ✓ Dialog (edit draft)
- ✓ Alert Dialog (delete confirmation, publish confirmation)
- ✓ Tabs (version history)
- ✓ Badge (draft status)

**shadcn provides:** Dialog, Alert Dialog, Tabs, Badge

---

## Comprehensive Pros & Cons

### ✅ PROS

#### Accessibility & Quality
1. **Built-in ARIA support** - Radix UI primitives have excellent accessibility
   - Proper focus management
   - Keyboard navigation (Tab, Enter, Escape, Arrow keys)
   - Screen reader support
   - Focus trapping in modals

2. **Battle-tested interactions** - Edge cases already handled:
   - Click outside to close
   - Escape key handling
   - Portal rendering (modals, popovers)
   - Z-index management
   - Scroll locking

3. **Reduces QA burden** - Less manual testing needed for interaction patterns

#### Developer Experience
4. **Massive time savings** - Don't rebuild accessible Dialog, Select, Dropdown from scratch
5. **Copy-paste model** - You own the code, can modify freely
6. **TypeScript-first** - Excellent types, great autocomplete
7. **Familiar to developers** - Industry-standard patterns, easy onboarding
8. **Active community** - Large community, lots of examples, Stack Overflow answers

#### Project-Specific
9. **Matches your roadmap** - You'll need ~15-20 of these components in next 10 tasks
10. **Internal tool = accessibility matters** - Power users need keyboard shortcuts
11. **Small team = time is precious** - 2-person team can't afford to rebuild everything
12. **Consistent patterns** - Less "how should this work?" decisions

#### Technical
13. **Small bundle impact** - Only ship what you use (tree-shakeable)
14. **Customizable** - Can adapt to match your design system
15. **No runtime bloat** - Just React + Radix UI primitives

---

### ❌ CONS

#### Technical Friction (CRITICAL)
1. **Tailwind v4 compatibility issue** ⚠️ **BIGGEST CONCERN**
   - shadcn/ui is built for Tailwind v3 with `tailwind.config.js`
   - You're using Tailwind v4 with CSS `@theme` directive
   - Potential style conflicts, theme token mismatches
   - Community workarounds exist but not officially supported

2. **Design token remapping required**
   - shadcn expects certain CSS variables (e.g., `--primary`, `--border`)
   - You have `--color-accent`, `--color-surface`, etc.
   - Need to either:
     - Remap your tokens to shadcn's naming
     - Customize every shadcn component to use your tokens

3. **Radix UI dependencies**
   - While shadcn is "copy-paste", components import from `@radix-ui/*`
   - Adds ~15-20 new dependencies:
     ```
     @radix-ui/react-dialog
     @radix-ui/react-dropdown-menu
     @radix-ui/react-select
     @radix-ui/react-tabs
     ... etc
     ```
   - Increases `node_modules` size, dependency management burden

#### Project Context
4. **Might be overkill** - Internal tool for 2 people, not enterprise SaaS
5. **Setup time now** - Takes time to:
   - Configure shadcn
   - Test Tailwind v4 compatibility
   - Customize to match design system
   - Learn shadcn patterns

6. **Added complexity**
   - More files in `components/ui/`
   - More patterns to understand
   - "shadcn way" vs "your way"

#### Long-term Maintenance
7. **Manual updates** - When shadcn components update:
   - No automatic updates (it's copy-paste)
   - Need to manually re-copy components
   - Track which components you've customized

8. **Style conflicts** - Your custom design system might clash with shadcn defaults
9. **Potential bloat** - Might only use 15 of 50+ available components
10. **Lock-in** - Once you build features with shadcn, hard to remove later

---

## Technical Deep Dive: Tailwind v4 Compatibility

### The Problem

**Tailwind v3 (shadcn expects this):**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
      }
    }
  }
}
```

**Tailwind v4 (what you have):**
```css
/* globals.css */
@theme {
  --color-bg: #141414;
  --color-surface: #161616;
  --color-accent: #e8b931;
}
```

### The Conflict
- shadcn components reference classes like `border-border`, `bg-primary`, `text-primary-foreground`
- These expect Tailwind config to map to CSS variables
- Your v4 CSS-based config doesn't have these mappings

### Solutions

#### Option 1: Downgrade to Tailwind v3 ⭐ SAFEST
**Pros:**
- shadcn works perfectly out of the box
- No compatibility issues
- Community support & examples all use v3

**Cons:**
- Lose Tailwind v4 features (though you're barely using them)
- v4 has better performance, new features

**Effort:** Medium - Need to migrate `@theme` to `tailwind.config.js`

#### Option 2: Adapt shadcn to Tailwind v4 🔧 EXPERIMENTAL
**Pros:**
- Keep Tailwind v4
- Stay on cutting edge

**Cons:**
- No official support
- Might hit friction
- Need to customize shadcn components to use your tokens
- Community is still figuring this out

**Effort:** High - Manual adaptation for each component

#### Option 3: Hybrid Approach 🎯 PRAGMATIC
**Pros:**
- Use shadcn only for complex components (Dialog, Dropdown, Select)
- Build simple components yourself (Button, Card, Badge)
- Balance between convenience and control

**Cons:**
- Still have Tailwind v4 compatibility issues for complex components
- Inconsistent component patterns

**Effort:** Medium-High

---

## Cost-Benefit Analysis

### Time Investment

**Upfront Cost (Adding shadcn):**
- Setup: 2-4 hours
- Tailwind v3 migration (if needed): 2-3 hours
- Design token mapping: 2-3 hours
- Testing & verification: 2 hours
- **Total: 8-12 hours**

**Ongoing Cost:**
- Learning shadcn patterns: 1-2 hours per developer
- Component updates: ~30 min per quarter
- **Total: Minimal**

### Time Savings

**Building components from scratch (upcoming tasks):**
- Accessible Dialog component: 4-6 hours
- Accessible Dropdown Menu: 3-4 hours
- Accessible Select component: 4-6 hours
- Form components with validation: 3-4 hours
- Tooltip, Popover: 2-3 hours each
- Alert Dialog: 2-3 hours
- Tabs: 2-3 hours
- Switch/Toggle: 2-3 hours
- **Total: 25-35 hours**

**With shadcn:**
- Copy component: 5 minutes
- Customize styling: 15-30 minutes per component
- **Total: ~8 components × 30 min = 4 hours**

**Net Savings: 20-30 hours** (even after upfront setup cost)

---

## Accessibility Comparison

### Custom Components (Current Approach)
**What you'd need to implement manually:**
- ARIA attributes (role, aria-expanded, aria-label, etc.)
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus management (trap focus in modals, restore focus on close)
- Screen reader announcements
- Disabled state handling
- Portal rendering (for modals/popovers)

**Risk:** Easy to miss edge cases, non-compliant with WCAG

### shadcn/ui Components
**What you get automatically:**
- ✅ WCAG 2.1 compliant (Radix UI primitives)
- ✅ Keyboard navigation built-in
- ✅ Screen reader tested
- ✅ Focus management handled
- ✅ Portal rendering for overlays
- ✅ Edge cases covered

**Benefit:** Ship accessible product faster

---

## Recommendation Matrix

| Scenario | Recommendation | Rationale |
|----------|---------------|-----------|
| **Tailwind v4 is non-negotiable** | ❌ Don't add shadcn yet | Wait for official v4 support, build custom for now |
| **Okay with Tailwind v3** | ✅ Add shadcn/ui | Best ROI, proven approach |
| **Time-constrained team** | ✅ Add shadcn/ui | Save 20-30 hours on upcoming tasks |
| **Accessibility is critical** | ✅ Add shadcn/ui | Get WCAG compliance out of the box |
| **Maximum control desired** | ❌ Don't add shadcn | Build custom components |
| **Small internal tool** | 🤷 Either way | Depends on time vs. control preference |

---

## Final Recommendation: ✅ YES, Add shadcn/ui

### Why

1. **ROI is clear** - Save 20-30 hours over next 10 tasks
2. **Accessibility matters** - Even for internal tools (keyboard power users)
3. **Small team** - 2 people can't afford to rebuild everything
4. **Upcoming complexity** - You'll need 15+ complex components soon
5. **Copy-paste model** - You own the code, full control

### How (Recommended Approach)

**Step 1: Choose Tailwind Strategy**
- **Recommended:** Move to Tailwind v3 for compatibility
- **Alternative:** Keep v4, adapt shadcn components manually

**Step 2: Install shadcn/ui**
```bash
npx shadcn@latest init
```

During init, configure:
- Style: **Default**
- Base color: **Neutral** (closest to your dark theme)
- CSS variables: **Yes**

**Step 3: Map Design Tokens**

Update `globals.css` to include shadcn variables alongside your existing ones:

```css
@theme {
  /* Your existing tokens */
  --color-bg: #141414;
  --color-surface: #161616;
  --color-accent: #e8b931;

  /* shadcn compatibility tokens */
  --background: 20 14.3% 4.1%;     /* maps to your bg */
  --foreground: 60 9.1% 97.8%;     /* maps to your text */
  --primary: 47.9 95.8% 53.1%;     /* maps to your accent */
  --border: 0 0% 16.5%;            /* maps to your border */
  /* ... etc */
}
```

**Step 4: Install Core Components (as needed)**
```bash
# Start with essentials for upcoming tasks
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add select
npx shadcn@latest add dropdown-menu
```

**Step 5: Test & Validate**
- Verify components match your design system
- Test keyboard navigation
- Verify dark theme consistency

**Step 6: Document Usage**
- Add `COMPONENTS.md` documenting when to use shadcn vs custom
- Add examples for team

---

## Alternative: Don't Add shadcn/ui

### If You Choose NOT to Add It

**When this makes sense:**
- Tailwind v4 is absolutely required
- Team values maximum control over convenience
- Budget allows 20-30 extra hours for component development

**What you'll need to build:**
1. Accessible Dialog component
2. Accessible Dropdown Menu component
3. Accessible Select component
4. Form components with validation
5. Tooltip component
6. Popover component
7. Alert Dialog component
8. Tabs component
9. Switch/Toggle component
10. Scroll Area component

**Recommended approach if going custom:**
- Study Radix UI documentation for accessibility patterns
- Use Headless UI as reference (similar to Radix)
- Build a `components/ui/` directory with consistent API
- Add comprehensive keyboard testing
- Consider hiring accessibility consultant for review

---

## Decision Checklist

Before deciding, answer these questions:

- [ ] Is Tailwind v4 a hard requirement, or can we use v3?
- [ ] Do we have 8-12 hours for initial setup and migration?
- [ ] Do we value time savings (20-30 hours) over maximum control?
- [ ] Is accessibility (WCAG 2.1 compliance) important for this internal tool?
- [ ] Are we comfortable with ~15-20 new Radix UI dependencies?
- [ ] Will keyboard power users benefit from better keyboard navigation?
- [ ] Do we want consistent, battle-tested interaction patterns?

**If mostly YES:** Add shadcn/ui
**If mostly NO:** Build custom components

---

## Next Steps (If Proceeding)

### Immediate Actions
1. **Decide on Tailwind version** (v3 vs v4)
2. **Run shadcn init** (if choosing to add it)
3. **Map design tokens** to shadcn variables
4. **Test a sample component** (Button or Dialog)
5. **Verify theme consistency**
6. **Update MEMORY.md** with decision

### Task Integration
- **Task 5 (Settings):** Use shadcn Form, Switch, Select, Tabs
- **Task 6 (Source Capture):** Use shadcn Dialog, Form, Dropdown Menu
- **Task 7 (Buckets):** Use shadcn Dialog, Alert Dialog, Popover

### Documentation
- Create `COMPONENTS.md` with usage guidelines
- Document which components are shadcn vs custom
- Add examples for common patterns

---

## References

- **shadcn/ui Docs:** https://ui.shadcn.com
- **Radix UI Docs:** https://www.radix-ui.com
- **Tailwind v4 Migration:** https://tailwindcss.com/docs/v4-beta
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

## Questions for Team Discussion

1. How important is Tailwind v4 to us? Can we move to v3?
2. Do we value time savings (20-30 hours) or maximum control?
3. How much do we care about accessibility for this internal tool?
4. Are we comfortable adding ~15-20 Radix UI dependencies?
5. What's our budget for component development time?

---

**End of Decision Document**

**Status:** ⏳ Awaiting decision from Orchestrator Agent + Team
**Next Review:** After decision is made, update MEMORY.md and orchestrator.md
