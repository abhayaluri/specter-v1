'use client'

import { useState, useEffect } from 'react'
import { Draft, DraftVersion, PLATFORM_CONFIG } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import StatusBadge from './StatusBadge'
import VersionList from './VersionList'
import ReactMarkdown from 'react-markdown'

interface DraftPanelProps {
  draftId: string
  onClose?: () => void
}

/**
 * Draft Panel Component
 *
 * Full panel shown after user saves a draft. Features:
 * - Editable title
 * - Status badge with dropdown
 * - Platform badge
 * - Rendered markdown content
 * - Copy to clipboard
 * - Version history sidebar
 * - View previous versions (read-only)
 */
export default function DraftPanel({ draftId, onClose }: DraftPanelProps) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [versions, setVersions] = useState<DraftVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [copied, setCopied] = useState(false)
  const [viewingVersion, setViewingVersion] = useState<DraftVersion | null>(null)

  useEffect(() => {
    fetchDraft()
  }, [draftId])

  const fetchDraft = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/drafts/${draftId}`)
      if (!res.ok) throw new Error('Failed to fetch draft')

      const data = await res.json()
      setDraft(data.draft)
      setVersions(data.versions || [])
      setEditedTitle(data.draft.title)
    } catch (err) {
      console.error('Failed to fetch draft:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTitleSave = async () => {
    if (!draft || editedTitle.trim() === draft.title) {
      setIsEditingTitle(false)
      return
    }

    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editedTitle.trim() }),
      })

      if (!res.ok) throw new Error('Failed to update title')

      const data = await res.json()
      setDraft(data.draft)
      setIsEditingTitle(false)
    } catch (err) {
      console.error('Failed to update title:', err)
      alert('Failed to update title')
    }
  }

  const handleStatusChange = async (newStatus: Draft['status']) => {
    if (!draft) return

    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update status')

      const data = await res.json()
      setDraft(data.draft)
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update status')
    }
  }

  const handleCopy = async () => {
    const contentToCopy = viewingVersion ? viewingVersion.content : draft?.content
    if (!contentToCopy) return

    try {
      await navigator.clipboard.writeText(contentToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleVersionSelect = (version: DraftVersion) => {
    setViewingVersion(version.version === draft?.version ? null : version)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading draft...</div>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Draft not found</div>
      </div>
    )
  }

  const platformConfig = PLATFORM_CONFIG[draft.platform]
  const displayContent = viewingVersion ? viewingVersion.content : draft.content

  return (
    <div className="h-full flex">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="mb-4 pb-4 border-b border-border">
          {/* Title */}
          <div className="mb-3">
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave()
                  if (e.key === 'Escape') {
                    setEditedTitle(draft.title)
                    setIsEditingTitle(false)
                  }
                }}
                autoFocus
                className="text-lg font-medium"
              />
            ) : (
              <h3
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-medium cursor-pointer hover:text-primary transition-colors"
              >
                {draft.title}
              </h3>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="secondary"
              style={{
                backgroundColor: platformConfig.color + '20',
                color: platformConfig.color,
              }}
            >
              {platformConfig.label}
            </Badge>
            <StatusBadge status={draft.status} onStatusChange={handleStatusChange} />
            <Badge variant="outline" className="text-xs">
              v{viewingVersion ? viewingVersion.version : draft.version}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm" className="flex-1">
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Viewing Old Version Notice */}
        {viewingVersion && (
          <div className="mb-4 p-3 bg-card border border-border rounded-lg text-sm">
            <p className="text-muted-foreground">
              📖 Viewing version {viewingVersion.version} (read-only). Click "Current" to return to the latest version.
            </p>
          </div>
        )}

        {/* Content (Rendered Markdown) */}
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-3">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-3">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              h1: ({ children }) => <h1 className="text-xl font-semibold mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
              code: ({ children, className }) => {
                const isInline = !className
                return isInline ? (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                ) : (
                  <code className="block bg-background/50 p-3 rounded text-xs font-mono overflow-x-auto">
                    {children}
                  </code>
                )
              },
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-3">
                  {children}
                </blockquote>
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      </div>

      {/* Version History Sidebar */}
      <div className="w-[240px] border-l border-border bg-card overflow-y-auto">
        <VersionList
          versions={versions}
          currentVersion={draft.version}
          onVersionSelect={handleVersionSelect}
        />
      </div>
    </div>
  )
}
