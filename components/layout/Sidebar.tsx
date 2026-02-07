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
