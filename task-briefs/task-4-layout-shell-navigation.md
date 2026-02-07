# Task 4 — Layout Shell & Navigation

**Status:** NOT STARTED
**Dependencies:** Task 3 (Authentication Flow — COMPLETE)
**Agent type:** Builder
**Estimated effort:** 1 agent session

---

## Objective

Build the core application layout shell with sidebar navigation, top bar, and responsive design. This creates the structure that all feature pages (Inbox, Buckets, Conversations, Drafts, Settings) will live within.

This is a **coding task.** You are building the app shell from scratch.

---

## Before You Start

Read these files in order:

1. `design-system.md` — Navigation patterns, component styles, spacing, animations
2. `product-requirements-document.md` — Navigation structure (lines 150-180), user flows
3. `technical-architecture-and-database-schema.md` — Layout patterns, component architecture
4. `claude-code-agent-instructions.md` — Component structure, naming conventions
5. `app/page.tsx` — Current dashboard (will be replaced with real layout)

---

## What's Already Done (Tasks 1-3)

- ✅ Next.js 14 project with App Router
- ✅ Design system tokens in `app/globals.css` (Tailwind v4)
- ✅ Authentication working (lib/supabase/server.ts, middleware)
- ✅ User profiles in database
- ✅ Placeholder pages for all routes

You're building the **navigation shell** that wraps these pages.

---

## Step-by-Step Instructions

### Step 1: Create the Main Layout Wrapper

The app needs a shared layout that wraps all authenticated pages. Create `components/layout/AppShell.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default async function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

This creates a flex layout with:
- Sidebar on the left (fixed width)
- Main content area on the right (flexible)
- Top bar above main content
- Scroll handling (sidebar fixed, main content scrollable)

### Step 2: Build the Sidebar Component

Create `components/layout/Sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  InboxIcon,
  FolderIcon,
  MessageSquareIcon,
  FileTextIcon,
  SettingsIcon,
} from './icons' // You'll create these in Step 3

const navigation = [
  { name: 'Inbox', href: '/inbox', icon: InboxIcon },
  { name: 'Buckets', href: '/buckets', icon: FolderIcon },
  { name: 'Conversations', href: '/conversations', icon: MessageSquareIcon },
  { name: 'Drafts', href: '/drafts', icon: FileTextIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col">
      {/* Logo / Title */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="font-display text-lg tracking-tight text-text">
          Cambrian
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname?.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer (optional) */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-text-dim text-center">
          Compound / Cambrian
        </p>
      </div>
    </div>
  )
}
```

Key features:
- Active route detection via `usePathname()`
- Hover states with smooth transitions
- Icon + label for each nav item
- Accent color for active state
- Scrollable if nav items exceed viewport

### Step 3: Create Simple Icon Components

Create `components/layout/icons.tsx`:

```tsx
interface IconProps {
  className?: string
}

export function InboxIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  )
}

export function FolderIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  )
}

export function MessageSquareIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  )
}

export function FileTextIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}
```

These are simple inline SVG icons using Heroicons. No external icon library needed.

### Step 4: Build the Top Bar

Create `components/layout/TopBar.tsx`:

```tsx
'use client'

import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types'
import LogoutButton from './LogoutButton'

interface TopBarProps {
  user: User
  profile: Profile | null
}

export default function TopBar({ user, profile }: TopBarProps) {
  return (
    <div className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      {/* Left side - could add breadcrumbs or search later */}
      <div className="flex-1">
        {/* Placeholder for search or breadcrumbs */}
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-text">
            {profile?.display_name || 'User'}
          </p>
          <p className="text-xs text-text-muted">{user.email}</p>
        </div>

        {/* Avatar placeholder */}
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
          <span className="text-sm font-medium text-accent">
            {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
          </span>
        </div>

        <LogoutButton />
      </div>
    </div>
  )
}
```

This shows:
- User profile info (name + email)
- Avatar with first letter of name
- Logout button (already exists from Task 3)

### Step 5: Add Mobile Responsive Sidebar

Update `components/layout/Sidebar.tsx` to support mobile:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  InboxIcon,
  FolderIcon,
  MessageSquareIcon,
  FileTextIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
} from './icons'

const navigation = [
  { name: 'Inbox', href: '/inbox', icon: InboxIcon },
  { name: 'Buckets', href: '/buckets', icon: FolderIcon },
  { name: 'Conversations', href: '/conversations', icon: MessageSquareIcon },
  { name: 'Drafts', href: '/drafts', icon: FileTextIcon },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface border border-border rounded-md text-text hover:bg-surface-hover"
      >
        {mobileMenuOpen ? (
          <XIcon className="w-6 h-6" />
        ) : (
          <MenuIcon className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-bg/80 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'w-64 bg-surface border-r border-border flex flex-col transition-transform lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-40',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Title */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <h1 className="font-display text-lg tracking-tight text-text">
            Cambrian
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href))

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-muted hover:text-text hover:bg-surface-hover'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-text-dim text-center">
            Compound / Cambrian
          </p>
        </div>
      </div>
    </>
  )
}
```

Add the Menu and X icons to `components/layout/icons.tsx`:

```tsx
export function MenuIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  )
}
```

This adds:
- Hamburger menu button (mobile only)
- Slide-in sidebar on mobile
- Overlay backdrop on mobile
- Always visible on desktop (lg breakpoint)

### Step 6: Update Root Dashboard to Use AppShell

Replace `app/page.tsx`:

```tsx
import AppShell from '@/components/layout/AppShell'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="font-display text-[32px] tracking-tight text-text mb-6">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-surface border border-border rounded-lg">
            <h3 className="text-text font-medium mb-2">Sources</h3>
            <p className="text-text-muted text-sm">Coming in Task 6</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-lg">
            <h3 className="text-text font-medium mb-2">Buckets</h3>
            <p className="text-text-muted text-sm">Coming in Task 7</p>
          </div>
          <div className="p-6 bg-surface border border-border rounded-lg">
            <h3 className="text-text font-medium mb-2">Drafts</h3>
            <p className="text-text-muted text-sm">Coming in Task 11</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
```

### Step 7: Update All Feature Pages to Use AppShell

Update these pages to wrap content in `<AppShell>`:

**app/inbox/page.tsx:**
```tsx
import AppShell from '@/components/layout/AppShell'

export default function InboxPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="font-display text-[32px] tracking-tight text-text mb-6">
          Inbox
        </h1>
        <p className="text-text-muted">Source capture coming in Task 6</p>
      </div>
    </AppShell>
  )
}
```

**app/buckets/page.tsx:**
```tsx
import AppShell from '@/components/layout/AppShell'

export default function BucketsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="font-display text-[32px] tracking-tight text-text mb-6">
          Buckets
        </h1>
        <p className="text-text-muted">Bucket management coming in Task 7</p>
      </div>
    </AppShell>
  )
}
```

**app/conversations/[id]/page.tsx:**
```tsx
import AppShell from '@/components/layout/AppShell'

export default function ConversationPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="font-display text-[32px] tracking-tight text-text mb-6">
          Conversation
        </h1>
        <p className="text-text-muted">Chat UI coming in Task 9</p>
      </div>
    </AppShell>
  )
}
```

**app/drafts/page.tsx:**
```tsx
import AppShell from '@/components/layout/AppShell'

export default function DraftsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="font-display text-[32px] tracking-tight text-text mb-6">
          Drafts
        </h1>
        <p className="text-text-muted">Draft management coming in Task 11</p>
      </div>
    </AppShell>
  )
}
```

**app/settings/page.tsx:**
```tsx
import AppShell from '@/components/layout/AppShell'

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="font-display text-[32px] tracking-tight text-text mb-6">
          Settings
        </h1>
        <p className="text-text-muted">Settings UI coming in Task 5</p>
      </div>
    </AppShell>
  )
}
```

### Step 8: Test the Layout

Start the dev server and test:

```bash
pnpm dev
```

**Desktop testing (1440px+):**
1. Log in if needed
2. Navigate to each page via sidebar
3. Verify active state highlights correctly
4. Verify smooth hover transitions
5. Verify scroll works (main content scrolls, sidebar stays fixed)

**Mobile testing (< 1024px):**
1. Resize browser to mobile width
2. Verify hamburger menu appears
3. Click hamburger → sidebar slides in
4. Click a nav item → sidebar closes, navigates
5. Click overlay → sidebar closes
6. Verify no horizontal scroll

**Keyboard testing:**
1. Tab through sidebar links
2. Enter key activates navigation
3. All interactive elements focusable

### Step 9: Add Focus Styles (Accessibility)

Update `app/globals.css` to add focus styles:

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

  /* Focus styles for keyboard navigation */
  *:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
}
```

This ensures keyboard users can see where they are when tabbing.

### Step 10: Commit Your Work

```bash
git add -A
git commit -m "Task 4: Layout shell & navigation — sidebar, top bar, responsive mobile menu, route highlighting"
```

---

## Output

A complete application layout with:
- Sidebar navigation with 5 routes (Inbox, Buckets, Conversations, Drafts, Settings)
- Top bar with user profile + logout
- Mobile-responsive with slide-in menu
- Active route highlighting
- Smooth transitions and hover states
- All feature pages wrapped in AppShell

---

## Acceptance Criteria

- [ ] Sidebar renders with all 5 navigation items
- [ ] Active route highlights with accent color
- [ ] Clicking nav items navigates correctly
- [ ] Top bar shows user name and email
- [ ] Logout button works (from Task 3)
- [ ] Mobile hamburger menu appears below 1024px
- [ ] Mobile menu slides in/out smoothly
- [ ] Clicking nav item on mobile closes menu
- [ ] Clicking overlay on mobile closes menu
- [ ] All pages (/, /inbox, /buckets, /conversations, /drafts, /settings) use AppShell
- [ ] Sidebar stays fixed, main content scrolls
- [ ] No TypeScript errors (`pnpm tsc --noEmit` passes)
- [ ] No console errors or warnings
- [ ] Focus styles visible for keyboard navigation
- [ ] Git committed with proper message

---

## Reference Files

| File | What to look at |
|------|----------------|
| `design-system.md` | Navigation patterns, spacing, colors, animations |
| `product-requirements-document.md` | Navigation structure, user flows |
| `app/globals.css` | Tailwind v4 design tokens (CSS custom properties) |
| `components/layout/LogoutButton.tsx` | Existing logout button from Task 3 |

---

## Notes for the Agent

- **Use the existing LogoutButton** from Task 3 — don't recreate it
- **Server Component for AppShell** — fetches user data server-side, passes to client components
- **Client Component for Sidebar** — needs `usePathname()` for active route detection
- **Tailwind v4 CSS custom properties** — Use `var(--color-bg)` in stylesheets, NOT @apply directives
- **Mobile breakpoint is `lg` (1024px)** — Sidebar hidden below this, visible above
- **Icons are inline SVGs** — No external library needed, keeps bundle small
- **All routes already exist** from Task 1 — just wrap them in AppShell
- **AppShell checks auth** — redirects to /login if not authenticated (Server Component)
- **Don't implement search yet** — placeholder in top bar, will be added later if needed
- **Conversations list page doesn't exist yet** — /conversations/[id] is just the single conversation view. A list page might come later, or users navigate via buckets.

---

## Design Specifications

**Sidebar:**
- Width: 256px (w-64)
- Background: var(--color-surface)
- Border: 1px solid var(--color-border)
- Nav item height: 40px (py-2.5)
- Active state: bg-accent/10 + text-accent
- Hover state: bg-surface-hover + text-text

**Top Bar:**
- Height: 64px (h-16)
- Background: var(--color-surface)
- Border: 1px solid var(--color-border)
- Avatar: 40px circle, accent background

**Mobile:**
- Sidebar slides from left with overlay
- Z-index: sidebar 40, overlay 30, menu button 50
- Transition: 200ms ease-in-out

---

## Testing Checklist

**Desktop:**
- [ ] All nav items visible and clickable
- [ ] Active route highlights correctly
- [ ] Hover states work on all nav items
- [ ] User name and email display in top bar
- [ ] Logout button works
- [ ] No layout shift when navigating

**Mobile (< 1024px):**
- [ ] Hamburger menu button appears
- [ ] Clicking hamburger opens sidebar
- [ ] Sidebar slides in from left
- [ ] Overlay darkens background
- [ ] Clicking overlay closes sidebar
- [ ] Clicking nav item closes sidebar + navigates
- [ ] No horizontal scroll at any width

**Accessibility:**
- [ ] All nav items keyboard accessible (Tab)
- [ ] Focus styles visible on all interactive elements
- [ ] Enter key activates navigation
- [ ] No focus traps

**Visual:**
- [ ] Dark theme consistent across all pages
- [ ] Accent color (amber) used for active state
- [ ] Smooth transitions (no jank)
- [ ] Text legible at all screen sizes
