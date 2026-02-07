'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Conversation, ConversationMode, PLATFORM_CONFIG } from '@/lib/types'
import { relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import NewConversationModal from './NewConversationModal'

/**
 * Conversation List View Component
 *
 * Shows all user conversations with:
 * - New Conversation button
 * - Filters by mode and bucket
 * - Conversation cards with metadata
 * - Empty state
 */
export default function ConversationListView() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [buckets, setBuckets] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filters
  const [modeFilter, setModeFilter] = useState<'all' | ConversationMode>('all')
  const [bucketFilter, setBucketFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [modeFilter, bucketFilter])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch conversations with filters
      const params = new URLSearchParams()
      if (modeFilter !== 'all') params.set('mode', modeFilter)
      if (bucketFilter !== 'all') params.set('bucketId', bucketFilter)

      const [conversationsRes, bucketsRes] = await Promise.all([
        fetch(`/api/conversations?${params.toString()}`),
        fetch('/api/buckets'),
      ])

      if (!conversationsRes.ok) throw new Error('Failed to fetch conversations')
      if (!bucketsRes.ok) throw new Error('Failed to fetch buckets')

      const conversationsData = await conversationsRes.json()
      const bucketsData = await bucketsRes.json()

      setConversations(conversationsData.conversations || [])
      setBuckets(bucketsData.buckets || [])
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConversationClick = (conversationId: string) => {
    router.push(`/conversations/${conversationId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1>Conversations</h1>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + New Conversation
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={modeFilter} onValueChange={(val) => setModeFilter(val as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All modes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modes</SelectItem>
            <SelectItem value="explore">Explore</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        <Select value={bucketFilter} onValueChange={setBucketFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All buckets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buckets</SelectItem>
            <SelectItem value="freestanding">Freestanding</SelectItem>
            {buckets.map((bucket) => (
              <SelectItem key={bucket.id} value={bucket.id}>
                {bucket.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty State */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)] text-center">
          <div className="space-y-4">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-muted-foreground">No conversations yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Start a conversation to begin exploring angles and drafting content
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              + New Conversation
            </Button>
          </div>
        </div>
      ) : (
        /* Conversation List */
        <div className="space-y-3">
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              bucketName={buckets.find((b) => b.id === conv.bucket_id)?.name}
              onClick={() => handleConversationClick(conv.id)}
            />
          ))}
        </div>
      )}

      {/* New Conversation Modal */}
      <NewConversationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  )
}

/**
 * Individual Conversation Card
 */
interface ConversationCardProps {
  conversation: Conversation
  bucketName?: string
  onClick: () => void
}

function ConversationCard({ conversation, bucketName, onClick }: ConversationCardProps) {
  const platformConfig = conversation.platform
    ? PLATFORM_CONFIG[conversation.platform]
    : null

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 hover:border-border-light transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-medium text-foreground mb-2">
            {conversation.title || 'Untitled Conversation'}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Badge */}
            <Badge
              variant={conversation.mode === 'explore' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {conversation.mode === 'explore' ? '🔍 Explore' : '✍️ Draft'}
            </Badge>

            {/* Platform Badge (Draft mode only) */}
            {conversation.platform && platformConfig && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: platformConfig.color,
                  color: platformConfig.color,
                }}
              >
                {platformConfig.label}
              </Badge>
            )}

            {/* Bucket Badge */}
            <Badge variant="outline" className="text-xs">
              {bucketName || 'Freestanding'}
            </Badge>

            {/* All Sources Badge */}
            {conversation.include_all_buckets && (
              <Badge variant="outline" className="text-xs">
                All Sources
              </Badge>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {relativeTime(conversation.updated_at)}
        </span>
      </div>
    </div>
  )
}
