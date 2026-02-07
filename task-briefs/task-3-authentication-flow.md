# Task 3 — Authentication Flow

**Status:** NOT STARTED
**Dependencies:** Task 1 (Project Scaffolding — COMPLETE), Task 2 (Supabase Database Setup — COMPLETE)
**Agent type:** Builder
**Estimated effort:** 1 agent session

---

## Objective

Implement authentication using Supabase Auth with email/password login. Create the login page, Supabase client utilities (browser + server), auth middleware for protected routes, and session management.

This is a **coding task.** You are building the authentication system from scratch.

---

## Before You Start

Read these files in order:

1. `technical-architecture-and-database-schema.md` — Auth architecture (lines 629-707), Supabase client setup patterns, middleware strategy
2. `supabase-setup-guide.md` — Supabase project details, auth configuration (email provider enabled, confirmations disabled)
3. `.env.local` — Live Supabase credentials (project URL, anon key, service role key)
4. `design-system.md` — UI component patterns (Section 6: Forms, Buttons, Cards)
5. `claude-code-agent-instructions.md` — Code style, naming conventions

---

## What's Already Done (Task 2)

- ✅ Supabase project created (ID: `fbjtjhyvuhcebyomvmsa`)
- ✅ Email auth provider enabled, confirmations disabled
- ✅ `profiles` table with RLS policies
- ✅ `handle_new_user()` trigger — auto-creates profile on signup
- ✅ Two test users created (Abhay + Srikar)
- ✅ `.env.local` populated with credentials

You're building the **client-side integration** that connects the Next.js app to this existing auth system.

---

## Step-by-Step Instructions

### Step 1: Create Supabase Browser Client

Create `lib/supabase/client.ts` for client-side auth operations:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

This is used in **Client Components** (login form, logout button, etc.).

### Step 2: Create Supabase Server Client

Create `lib/supabase/server.ts` for server-side auth (API routes, Server Components):

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

This handles server-side session management via cookies.

### Step 3: Create Auth Middleware

Create `middleware.ts` at the project root:

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes — redirect to /login if not authenticated
  const protectedRoutes = ['/inbox', '/buckets', '/conversations', '/drafts', '/settings']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in and visiting /login, redirect to dashboard
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

This middleware:
- Refreshes the user session on every request
- Redirects unauthenticated users from protected routes to `/login`
- Redirects authenticated users from `/login` to dashboard (`/`)

### Step 4: Build the Login Page

Replace `app/login/page.tsx` with a full login form:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-[32px] tracking-tight text-text mb-2">
            Cambrian Content Engine
          </h1>
          <p className="text-text-muted text-sm">Sign in to continue</p>
        </div>

        <div className="bg-surface border border-border rounded-lg p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-md text-text placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-bg border border-border rounded-md text-text placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-md">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-accent text-bg font-medium rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-text-dim">
          For Compound / Cambrian Explorations team members only
        </p>
      </div>
    </div>
  )
}
```

This login page:
- Uses the browser Supabase client
- Handles email/password signin
- Shows error messages
- Redirects to dashboard on success
- Uses design system tokens (bg, surface, border, text, accent)

### Step 5: Add Logout Functionality

Create `app/api/auth/logout/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
```

### Step 6: Update Dashboard to Show Auth State

Replace `app/page.tsx` with an authenticated dashboard:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/layout/LogoutButton'

export default async function DashboardPage() {
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
    <div className="min-h-screen bg-bg p-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-[32px] tracking-tight text-text mb-2">
            Cambrian Content Engine
          </h1>
          <p className="text-text-muted text-sm">
            Welcome back, {profile?.display_name || user.email}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-surface border border-border rounded-lg">
          <h3 className="text-text font-medium mb-2">Sources</h3>
          <p className="text-text-muted text-sm">No sources yet</p>
        </div>
        <div className="p-6 bg-surface border border-border rounded-lg">
          <h3 className="text-text font-medium mb-2">Buckets</h3>
          <p className="text-text-muted text-sm">No buckets yet</p>
        </div>
        <div className="p-6 bg-surface border border-border rounded-lg">
          <h3 className="text-text font-medium mb-2">Drafts</h3>
          <p className="text-text-muted text-sm">No drafts yet</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-surface border border-border rounded-lg">
        <h3 className="text-text font-medium mb-4">Auth Status</h3>
        <div className="space-y-2 text-sm font-mono">
          <p className="text-text-muted">
            User ID: <span className="text-text">{user.id}</span>
          </p>
          <p className="text-text-muted">
            Email: <span className="text-text">{user.email}</span>
          </p>
          <p className="text-text-muted">
            Profile: <span className="text-success">✓ Created via trigger</span>
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Step 7: Create Logout Button Component

Create `components/layout/LogoutButton.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-4 py-2 bg-surface border border-border text-text-muted hover:text-text hover:border-border-light rounded-md text-sm font-medium transition-all disabled:opacity-50"
    >
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
```

### Step 8: Add a Sign Up Option (Optional but Recommended)

Update `app/login/page.tsx` to add a signup mode toggle. Add this state and handler:

```tsx
const [mode, setMode] = useState<'signin' | 'signup'>('signin')

async function handleSignup(e: React.FormEvent) {
  e.preventDefault()
  setError('')
  setLoading(true)

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    setError(error.message)
    setLoading(false)
  } else {
    router.push('/')
    router.refresh()
  }
}
```

Then update the form to handle both modes:

```tsx
<form onSubmit={mode === 'signin' ? handleLogin : handleSignup} className="space-y-6">
  {/* ...existing form fields... */}

  <button type="submit" disabled={loading} className="...">
    {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating account...') : (mode === 'signin' ? 'Sign in' : 'Create account')}
  </button>
</form>

<button
  type="button"
  onClick={() => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
  }}
  className="mt-4 w-full text-sm text-text-muted hover:text-text transition-colors"
>
  {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
</button>
```

This allows Abhay and Srikar to create accounts without needing the Supabase dashboard.

### Step 9: Test Authentication Flow

**Test signup:**
```bash
pnpm dev
```

1. Navigate to `http://localhost:3000/login`
2. Switch to "Sign up" mode
3. Create a test account with email + password
4. Verify:
   - ✅ You're redirected to dashboard
   - ✅ Dashboard shows your email
   - ✅ Profile was auto-created (check "Auth Status" section)

**Test signin:**
1. Click "Sign out"
2. Sign in with the same credentials
3. Verify you land back on the dashboard

**Test protected routes:**
1. Sign out
2. Try navigating to `/inbox` directly → should redirect to `/login`
3. Sign in → should redirect back to `/`

**Test existing users:**
Use the credentials for the two users created in Task 2:
- Abhay's account (email from Task 2)
- Srikar's account (email from Task 2)

Both should work and show their profiles.

### Step 10: Commit Your Work

```bash
git add -A
git commit -m "Task 3: Authentication flow — Supabase Auth, login/signup, middleware, session management"
```

---

## Output

A complete authentication system with:
- Supabase client utilities (browser + server)
- Auth middleware with route protection
- Login/signup page with form validation
- Logout functionality
- Authenticated dashboard showing user profile
- Session management via cookies

---

## Acceptance Criteria

- [ ] `lib/supabase/client.ts` created with browser client
- [ ] `lib/supabase/server.ts` created with server client
- [ ] `middleware.ts` created with session refresh + route protection
- [ ] Login page works — can sign in with test users from Task 2
- [ ] Signup works — can create new accounts (profile auto-created via trigger)
- [ ] Logout works — clears session and redirects to `/login`
- [ ] Protected routes redirect to `/login` when unauthenticated
- [ ] `/login` redirects to `/` when already authenticated
- [ ] Dashboard shows user email and profile data
- [ ] No TypeScript errors (`pnpm tsc --noEmit` passes)
- [ ] No runtime errors in browser console
- [ ] Session persists across page refreshes
- [ ] Git committed with proper message

---

## Reference Files

| File | What to look at |
|------|----------------|
| `.env.local` | Supabase credentials (URL, anon key, service role key) |
| `supabase-setup-guide.md` | Auth configuration details, test user accounts |
| `technical-architecture-and-database-schema.md` | Auth patterns, RLS policies, profile trigger |
| `design-system.md` | Form input styles, button styles, card layouts |

---

## Notes for the Agent

- **The auth system is already configured in Supabase** — you're just building the client-side integration
- **Email confirmations are disabled** — users can sign in immediately after signup
- **Profiles are auto-created** — the `handle_new_user()` trigger in the database creates a profile row when a new user signs up. You don't need to create it manually.
- **Use `@supabase/ssr`** — this is the official Supabase package for Next.js App Router with server-side rendering
- **Middleware runs on every request** — it refreshes the session and checks auth state before the route handler runs
- **Server Components can access session** — use `lib/supabase/server.ts` to check auth in Server Components and API routes
- **Client Components use browser client** — use `lib/supabase/client.ts` for client-side auth operations (login, logout, etc.)
- **Don't implement password reset yet** — V1 is for a 2-person team, password reset can be handled via Supabase dashboard if needed
- **RLS is already enabled** — the policies set up in Task 2 ensure users can only access their own data

---

## Testing Checklist

- [ ] Signup creates new user + profile automatically
- [ ] Login works with existing user credentials
- [ ] Logout clears session and redirects
- [ ] Visiting `/inbox` while logged out → redirects to `/login`
- [ ] Visiting `/login` while logged in → redirects to `/`
- [ ] Dashboard shows correct user email and profile name
- [ ] Session persists after browser refresh
- [ ] No console errors or TypeScript errors
