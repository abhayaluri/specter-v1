'use client'

import { useState, useEffect } from 'react'
import { ExtractedDraft } from '@/lib/claude/parse'
import { Draft, PLATFORM_CONFIG } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import DraftPanel from '@/components/drafts/DraftPanel'

interface DraftPreviewProps {
  draft: ExtractedDraft | null
  conversationId: string
  bucketId?: string | null
}

/**
 * Draft Preview Component
 *
 * Right pane for Draft mode.
 * Shows the latest extracted draft with:
 * - Platform badge
 * - Draft title
 * - Rendered markdown content
 * - Copy to clipboard button
 */
export default function DraftPreview({ draft, conversationId, bucketId }: DraftPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [savedDraft, setSavedDraft] = useState<Draft | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showDraftPanel, setShowDraftPanel] = useState(false)

  // Check if a saved draft exists for this conversation + platform
  useEffect(() => {
    if (draft) {
      checkForSavedDraft()
    }
  }, [draft?.platform, conversationId])

  const checkForSavedDraft = async () => {
    if (!draft) return

    try {
      const res = await fetch(
        `/api/drafts?conversationId=${conversationId}&platform=${draft.platform}`
      )
      if (!res.ok) return

      const data = await res.json()
      if (data.drafts && data.drafts.length > 0) {
        setSavedDraft(data.drafts[0])
      } else {
        setSavedDraft(null)
      }
    } catch (err) {
      console.error('Failed to check for saved draft:', err)
    }
  }

  const handleSaveDraft = async () => {
    if (!draft) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          platform: draft.platform,
          content: draft.content,
          conversationId,
          bucketId: bucketId || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to save draft')

      const data = await res.json()
      setSavedDraft(data.draft)
      setShowDraftPanel(true)
    } catch (err) {
      console.error('Failed to save draft:', err)
      alert('Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateDraft = async () => {
    if (!draft || !savedDraft) return

    setIsSaving(true)
    try {
      const res = await fetch(`/api/drafts/${savedDraft.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: draft.content,
        }),
      })

      if (!res.ok) throw new Error('Failed to update draft')

      const data = await res.json()
      setSavedDraft(data.draft)
      setShowDraftPanel(true)
    } catch (err) {
      console.error('Failed to update draft:', err)
      alert('Failed to update draft')
    } finally {
      setIsSaving(false)
    }
  }

  if (!draft) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-4xl mb-4">✍️</div>
          <h3 className="font-medium text-foreground mb-2">No draft yet</h3>
          <p className="text-sm text-muted-foreground">
            Draft will appear here when Sonnet writes one
          </p>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const platformConfig = PLATFORM_CONFIG[draft.platform as keyof typeof PLATFORM_CONFIG]

  // Show DraftPanel if user clicked save/update and we have a saved draft
  if (showDraftPanel && savedDraft) {
    return <DraftPanel draftId={savedDraft.id} onClose={() => setShowDraftPanel(false)} />
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-4 pb-4 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-medium text-foreground flex-1">{draft.title}</h3>
          <Badge
            variant="secondary"
            className="flex-shrink-0"
            style={{ backgroundColor: platformConfig?.color + '20', color: platformConfig?.color }}
          >
            {platformConfig?.label || draft.platform}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </Button>
          {savedDraft ? (
            <Button
              onClick={handleUpdateDraft}
              disabled={isSaving}
              size="sm"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? 'Updating...' : 'Update Draft'}
            </Button>
          ) : (
            <Button
              onClick={handleSaveDraft}
              disabled={isSaving}
              size="sm"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? 'Saving...' : 'Save to Drafts'}
            </Button>
          )}
        </div>
      </div>

      {/* Draft Content (Rendered Markdown) */}
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
          {draft.content}
        </ReactMarkdown>
      </div>

      {/* Status Note */}
      {savedDraft && (
        <div className="mt-6 p-3 bg-card border border-border rounded-lg text-xs text-muted-foreground">
          ✓ Saved to drafts. Click "Update Draft" to save new revisions, or view full draft panel for version history.
        </div>
      )}
    </div>
  )
}
