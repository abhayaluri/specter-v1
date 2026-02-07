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
