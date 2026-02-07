'use client'

import { useState } from 'react'
import { Source, SourceType } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { relativeTime } from '@/lib/format'

interface SourceCardProps {
  source: Source
  buckets: any[]
  onUpdate: () => void
  onDelete: (id: string) => void
}

const SOURCE_TYPE_CONFIG: Record<SourceType, { label: string; color: string }> = {
  note: { label: 'Note', color: 'bg-secondary text-secondary-foreground' },
  link: { label: 'Link', color: 'bg-blue-500/15 text-blue-400' },
  tweet: { label: 'Tweet', color: 'bg-sky-500/15 text-sky-400' },
  article_clip: { label: 'Article', color: 'bg-purple-500/15 text-purple-400' },
  podcast_note: { label: 'Podcast', color: 'bg-orange-500/15 text-orange-400' },
  voice_memo: { label: 'Voice', color: 'bg-emerald-500/15 text-emerald-400' },
}

export default function SourceCard({ source, buckets, onUpdate, onDelete }: SourceCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(source.content)
  const [isSaving, setIsSaving] = useState(false)

  const typeConfig = SOURCE_TYPE_CONFIG[source.source_type]

  const handleSaveEdit = async () => {
    if (editedContent === source.content) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      })

      if (!res.ok) throw new Error('Failed to update source')

      setIsEditing(false)
      onUpdate()
    } catch (err) {
      console.error('Update failed:', err)
      alert('Failed to update source')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMoveToBucket = async (bucketId: string) => {
    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketId }),
      })

      if (!res.ok) throw new Error('Failed to move source')
      onUpdate()
    } catch (err) {
      console.error('Move failed:', err)
      alert('Failed to move source')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this source?')) return

    try {
      const res = await fetch(`/api/sources/${source.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete source')
      onDelete(source.id)
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete source')
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-border-light transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Badge className={typeConfig.color}>
            {typeConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {relativeTime(source.created_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs h-7"
              >
                Edit
              </Button>
              {buckets.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Move
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {buckets.map((bucket) => (
                      <DropdownMenuItem
                        key={bucket.id}
                        onClick={() => handleMoveToBucket(bucket.id)}
                      >
                        {bucket.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-xs h-7 text-destructive hover:text-destructive"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-[100px]"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditedContent(source.content)
                setIsEditing(false)
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
            {source.content}
          </p>
          {source.source_url && (
            <a
              href={source.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              {source.source_url}
            </a>
          )}
        </>
      )}
    </div>
  )
}
