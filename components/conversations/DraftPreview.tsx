'use client'

import { useState } from 'react'
import { ExtractedDraft } from '@/lib/claude/parse'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLATFORM_CONFIG } from '@/lib/types'
import ReactMarkdown from 'react-markdown'

interface DraftPreviewProps {
  draft: ExtractedDraft | null
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
export default function DraftPreview({ draft }: DraftPreviewProps) {
  const [copied, setCopied] = useState(false)

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
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </Button>
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

      {/* Note about saving */}
      <div className="mt-6 p-3 bg-card border border-border rounded-lg text-xs text-muted-foreground">
        💡 This draft is auto-saved in this conversation. Use "Save to Drafts" (coming in Task 10) to add it to your drafts list.
      </div>
    </div>
  )
}
