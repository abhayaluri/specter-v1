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
      {/* Left side - placeholder for search or breadcrumbs */}
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
