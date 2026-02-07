'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SourceType } from '@/lib/types'

interface CaptureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCaptureSuccess?: () => void
}

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'tweet', label: 'Tweet' },
  { value: 'article_clip', label: 'Article Clip' },
  { value: 'podcast_note', label: 'Podcast Note' },
  { value: 'voice_memo', label: 'Voice Memo' },
]

export default function CaptureModal({ open, onOpenChange, onCaptureSuccess }: CaptureModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sourceType, setSourceType] = useState<SourceType>('note')
  const [sourceUrl, setSourceUrl] = useState('')
  const [bucketId, setBucketId] = useState<string | null>(null)
  const [buckets, setBuckets] = useState<any[]>([])
  const [enableBulkSplit, setEnableBulkSplit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch buckets for destination picker
  useEffect(() => {
    if (open) {
      fetch('/api/buckets')
        .then((res) => res.json())
        .then((data) => {
          if (data.buckets) setBuckets(data.buckets)
        })
        .catch(() => {
          // Bucket API doesn't exist yet (Task 7) - that's ok
        })
    }
  }, [open])

  // Auto-detect multi-line paste for bulk split suggestion
  useEffect(() => {
    const lineCount = content.split('\n').filter(Boolean).length
    if (lineCount > 2 && !enableBulkSplit) {
      // Don't auto-enable, just make the toggle available
    }
  }, [content])

  const handleSubmit = async () => {
    if (!content.trim()) return

    setIsSubmitting(true)

    try {
      let payload: any

      if (enableBulkSplit) {
        // Split by double newline into separate sources
        const items = content
          .split(/\n\n+/)
          .map((text) => text.trim())
          .filter(Boolean)
          .map((text) => ({
            content: text,
            title: title || undefined,
            sourceType,
            sourceUrl: sourceUrl || undefined,
            bucketId: bucketId || undefined,
          }))
        payload = items
      } else {
        payload = {
          content,
          title: title || undefined,
          sourceType,
          sourceUrl: sourceUrl || undefined,
          bucketId: bucketId || undefined,
        }
      }

      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to capture source')

      const data = await res.json()

      // Reset form
      setTitle('')
      setContent('')
      setSourceUrl('')
      setSourceType('note')
      setBucketId(null)
      setEnableBulkSplit(false)

      // Close modal
      onOpenChange(false)

      // Notify parent
      if (onCaptureSuccess) onCaptureSuccess()
    } catch (err) {
      console.error('Capture failed:', err)
      alert('Failed to capture source. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showUrlField = sourceType === 'link' || sourceType === 'tweet' || sourceType === 'article_clip'
  const showBulkSplitToggle = content.split('\n').filter(Boolean).length > 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Capture</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title (optional) */}
          <div>
            <Label htmlFor="title" className="text-sm text-muted-foreground">
              Title <span className="text-text-dim">(optional)</span>
            </Label>
            <input
              id="title"
              type="text"
              placeholder="Give this source a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-sm text-muted-foreground">
              Content
            </Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1.5 min-h-[120px] max-h-[300px] overflow-y-auto bg-background border-border"
              autoFocus
            />
          </div>

          {/* Source Type */}
          <div>
            <Label htmlFor="sourceType" className="text-sm text-muted-foreground">
              Type
            </Label>
            <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
              <SelectTrigger id="sourceType" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source URL (conditional) */}
          {showUrlField && (
            <div>
              <Label htmlFor="sourceUrl" className="text-sm text-muted-foreground">
                URL
              </Label>
              <input
                id="sourceUrl"
                type="url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Destination */}
          <div>
            <Label htmlFor="destination" className="text-sm text-muted-foreground">
              Destination
            </Label>
            <Select value={bucketId || 'inbox'} onValueChange={(v) => setBucketId(v === 'inbox' ? null : v)}>
              <SelectTrigger id="destination" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbox">Inbox</SelectItem>
                {buckets.map((bucket) => (
                  <SelectItem key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk split toggle */}
          {showBulkSplitToggle && (
            <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-md border border-border">
              <input
                type="checkbox"
                id="bulkSplit"
                checked={enableBulkSplit}
                onChange={(e) => setEnableBulkSplit(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <Label htmlFor="bulkSplit" className="text-sm text-foreground cursor-pointer">
                Split into individual sources (by paragraph)
              </Label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
            {isSubmitting ? 'Capturing...' : 'Capture'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
