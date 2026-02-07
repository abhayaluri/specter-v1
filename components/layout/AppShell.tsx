import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import CaptureProvider from '@/components/capture/CaptureProvider'

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
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist or query fails, use a safe fallback
  const safeProfile = profile ?? {
    id: user.id,
    display_name: user.email?.split('@')[0] ?? 'User',
    avatar_url: null,
    personal_voice_profile: [],
    explore_model: 'claude-opus-4-5-20250929',
    draft_model: 'claude-sonnet-4-20250514',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return (
    <CaptureProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar user={user} profile={safeProfile} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </CaptureProvider>
  )
}
