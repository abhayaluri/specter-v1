'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bucket, ConversationMode, Platform, PLATFORM_CONFIG } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface NewConversationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultBucketId?: string | null
  defaultMode?: ConversationMode
}

/**
 * New Conversation Modal
 *
 * Allows user to create a new conversation with:
 * - Mode selection (Explore/Draft)
 * - Bucket selection (or Freestanding)
 * - Voice selection (Personal/Compound)
 * - Platform selection (Draft mode only)
 * - Include all sources toggle
 */
export default function NewConversationModal({
  open,
  onOpenChange,
  defaultBucketId,
  defaultMode = 'explore',
}: NewConversationModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<ConversationMode>(defaultMode)
  const [bucketId, setBucketId] = useState<string | null>(defaultBucketId || null)
  const [voiceMode, setVoiceMode] = useState<'personal' | 'compound'>('personal')
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [includeAllBuckets, setIncludeAllBuckets] = useState(true)
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch buckets on mount
  useEffect(() => {
    if (open) {
      fetchBuckets()
    }
  }, [open])

  const fetchBuckets = async () => {
    try {
      const res = await fetch('/api/buckets')
      if (!res.ok) throw new Error('Failed to fetch buckets')
      const data = await res.json()
      setBuckets(data.buckets || [])
    } catch (err) {
      console.error('Failed to fetch buckets:', err)
    }
  }

  const handleCreate = async () => {
    // Validation: Draft mode requires platform
    if (mode === 'draft' && !platform) {
      alert('Please select a platform for Draft mode')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          bucketId: bucketId || undefined,
          platform: platform || undefined,
          includeAllBuckets,
        }),
      })

      if (!res.ok) throw new Error('Failed to create conversation')

      const { conversation } = await res.json()
      router.push(`/conversations/${conversation.id}`)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to create conversation:', err)
      alert('Failed to create conversation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start a Conversation</DialogTitle>
          <DialogDescription>
            Choose how you want to work: explore angles and connections, or draft platform-specific content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Mode</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('explore')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  mode === 'explore'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border-light'
                }`}
              >
                <div className="text-2xl mb-2">🔍</div>
                <div className="font-medium mb-1">Explore Mode</div>
                <div className="text-xs text-muted-foreground mb-2">
                  Brainstorm angles, find connections, synthesize ideas
                </div>
                <div className="text-xs text-muted-foreground">Uses: Claude Opus</div>
              </button>

              <button
                onClick={() => setMode('draft')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  mode === 'draft'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border-light'
                }`}
              >
                <div className="text-2xl mb-2">✍️</div>
                <div className="font-medium mb-1">Draft Mode</div>
                <div className="text-xs text-muted-foreground mb-2">
                  Write content for a specific platform
                </div>
                <div className="text-xs text-muted-foreground">Uses: Claude Sonnet</div>
              </button>
            </div>
          </div>

          {/* Platform Selection (Draft mode only) */}
          {mode === 'draft' && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Platform (Required)</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setPlatform(key as Platform)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      platform === key
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-border-light'
                    }`}
                  >
                    <div className="text-xl mb-1">{config.icon}</div>
                    <div className="font-medium text-sm mb-1">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voice Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Voice</Label>
            <Select value={voiceMode} onValueChange={(val) => setVoiceMode(val as 'personal' | 'compound')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal Voice (default)</SelectItem>
                <SelectItem value="compound">Compound Voice (shared)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              You can change voice mid-conversation
            </p>
          </div>

          {/* Bucket Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Bucket</Label>
            <Select value={bucketId || 'freestanding'} onValueChange={(val) => setBucketId(val === 'freestanding' ? null : val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freestanding">Freestanding (no bucket)</SelectItem>
                {buckets.map((bucket) => (
                  <SelectItem key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Include All Sources Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Search all sources</Label>
              <p className="text-xs text-muted-foreground">
                Include sources from all buckets, not just the selected bucket
              </p>
            </div>
            <Switch checked={includeAllBuckets} onCheckedChange={setIncludeAllBuckets} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || (mode === 'draft' && !platform)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading
              ? 'Creating...'
              : mode === 'explore'
              ? 'Start Explore'
              : 'Start Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
