'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bucket, Source, Draft, Conversation, BUCKET_COLORS } from '@/lib/types'
import { relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import SourceCard from '@/components/inbox/SourceCard'

interface BucketDetailViewProps {
  initialBucket: Bucket
  initialSources: Source[]
  initialDrafts: Draft[]
  initialConversations: Conversation[]
  allBuckets: Bucket[]
}

export default function BucketDetailView({
  initialBucket,
  initialSources,
  initialDrafts,
  initialConversations,
  allBuckets,
}: BucketDetailViewProps) {
  const router = useRouter()
  const [bucket, setBucket] = useState(initialBucket)
  const [sources, setSources] = useState(initialSources)
  const [drafts] = useState(initialDrafts)
  const [conversations] = useState(initialConversations)

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(bucket.name)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState(bucket.description || '')

  const otherBuckets = allBuckets.filter((b) => b.id !== bucket.id)

  const updateBucket = async (updates: Partial<Bucket>) => {
    try {
      const res = await fetch(`/api/buckets/${bucket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) throw new Error('Failed to update bucket')

      const data = await res.json()
      setBucket(data.bucket)
    } catch (err) {
      console.error('Update bucket failed:', err)
      alert('Failed to update bucket')
    }
  }

  const handleSaveName = async () => {
    if (editedName.trim() === bucket.name) {
      setIsEditingName(false)
      return
    }
    await updateBucket({ name: editedName.trim() })
    setIsEditingName(false)
  }

  const handleSaveDescription = async () => {
    if (editedDescription.trim() === (bucket.description || '')) {
      setIsEditingDescription(false)
      return
    }
    await updateBucket({ description: editedDescription.trim() })
    setIsEditingDescription(false)
  }

  const handleColorChange = async (color: string) => {
    await updateBucket({ color })
  }

  const handleStartConversation = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketId: bucket.id }),
      })

      if (!res.ok) throw new Error('Failed to create conversation')

      const { conversation } = await res.json()
      router.push(`/conversations/${conversation.id}`)
    } catch (err) {
      console.error('Create conversation failed:', err)
      alert('Failed to start conversation')
    }
  }

  const handleDeleteBucket = async () => {
    try {
      const res = await fetch(`/api/buckets/${bucket.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete bucket')

      router.push('/buckets')
    } catch (err) {
      console.error('Delete bucket failed:', err)
      alert('Failed to delete bucket')
    }
  }

  const refreshSources = async () => {
    try {
      const res = await fetch(`/api/buckets/${bucket.id}`)
      if (!res.ok) throw new Error('Failed to refresh')
      const data = await res.json()
      setSources(data.sources ?? [])
    } catch (err) {
      console.error('Refresh failed:', err)
    }
  }

  return (
    <div className="p-8 max-w-7xl">
      {/* Back Link */}
      <Link
        href="/buckets"
        className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center mb-6"
      >
        ← Buckets
      </Link>

      {/* Header */}
      <div className="mb-8 pb-6 border-b border-border">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background transition-all flex-shrink-0 mt-1"
                  style={{ backgroundColor: bucket.color }}
                  aria-label="Change bucket color"
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3">
                <div className="flex gap-2 flex-wrap max-w-[200px]">
                  {BUCKET_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-all ${
                        bucket.color === color
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-popover'
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Name */}
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex gap-2 items-center">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') {
                        setEditedName(bucket.name)
                        setIsEditingName(false)
                      }
                    }}
                    autoFocus
                    className="text-[40px] font-display h-auto py-1 px-2"
                  />
                </div>
              ) : (
                <h1
                  onClick={() => setIsEditingName(true)}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                  {bucket.name}
                </h1>
              )}

              {/* Description */}
              <div className="mt-2">
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      onBlur={handleSaveDescription}
                      placeholder="Add description..."
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDescription}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditedDescription(bucket.description || '')
                          setIsEditingDescription(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => setIsEditingDescription(true)}
                    className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    {bucket.description || 'Add description...'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleStartConversation}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start Conversation
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-popover">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete bucket?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will move all {sources.length} source(s) back to your inbox. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteBucket}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Bucket
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Sources Section */}
      <div className="mb-8">
        <h3 className="mb-4">Sources ({sources.length})</h3>
        {sources.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground mb-4">No sources in this bucket yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Move sources from your inbox, or capture directly into this bucket
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" onClick={() => router.push('/inbox')}>
                Go to Inbox
              </Button>
              <Button
                onClick={() => {
                  // Trigger capture modal (Cmd+K)
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Capture
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                buckets={[
                  { id: null, name: 'Inbox' }, // Allow moving back to inbox
                  ...otherBuckets,
                ]}
                onUpdate={refreshSources}
                onDelete={refreshSources}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4">Drafts ({drafts.length})</h3>
          <div className="space-y-2">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                onClick={() => router.push(`/drafts/${draft.id}`)}
                className="bg-card border border-border rounded-lg p-4 hover:border-border-light transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">{draft.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {draft.platform}
                      </Badge>
                      <Badge
                        variant={draft.status === 'published' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {draft.status}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(draft.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations Section */}
      {conversations.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4">Conversations ({conversations.length})</h3>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => router.push(`/conversations/${conv.id}`)}
                className="bg-card border border-border rounded-lg p-4 hover:border-border-light transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-1">
                      {conv.title || 'Untitled Conversation'}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {conv.mode}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(conv.updated_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
