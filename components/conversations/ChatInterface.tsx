'use client'

import { useState, useCallback } from 'react'
import { Conversation, Message, ConversationMode, Platform } from '@/lib/types'
import { useChatStream } from '@/hooks/useChatStream'
import ConversationHeader from './ConversationHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import SourcePanel from './SourcePanel'
import DraftPreview from './DraftPreview'

interface ChatInterfaceProps {
  conversation: Conversation
  initialMessages: Message[]
}

/**
 * Chat Interface Component
 *
 * Main orchestrator for the conversation UI.
 * Manages:
 * - Local message state
 * - Streaming via useChatStream hook
 * - Mode/voice/platform switching
 * - Split-pane layout (chat + context)
 */
export default function ChatInterface({ conversation: initialConversation, initialMessages }: ChatInterfaceProps) {
  const [conversation, setConversation] = useState(initialConversation)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [voiceMode, setVoiceMode] = useState<'personal' | 'compound'>('personal')

  // Streaming hook
  const {
    sendMessage,
    isStreaming,
    streamingText,
    retrievedSources,
    lastDraft,
    error,
  } = useChatStream({
    onComplete: (messageId, draft) => {
      // After streaming completes, fetch updated messages
      fetchMessages()
    },
    onError: (errorMsg) => {
      console.error('Chat error:', errorMsg)
      // Optionally show toast notification
    },
  })

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json()
      setMessages(data.messages || [])
      setConversation(data.conversation)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }, [conversation.id])

  const handleSendMessage = useCallback(
    (message: string) => {
      // Optimistic update: add user message to local state immediately
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversation.id,
        role: 'user',
        content: message,
        draft_content: null,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, optimisticMessage])

      // Send to API
      sendMessage({
        conversationId: conversation.id,
        message,
        mode: conversation.mode,
        bucketId: conversation.bucket_id || undefined,
        includeAllBuckets: conversation.include_all_buckets,
        platform: conversation.platform || undefined,
        voiceMode,
      })
    },
    [conversation, voiceMode, sendMessage]
  )

  const handleModeChange = useCallback(
    async (newMode: ConversationMode, platform?: Platform) => {
      try {
        const updates: any = { mode: newMode }
        if (newMode === 'draft' && platform) {
          updates.platform = platform
        }

        const res = await fetch(`/api/conversations/${conversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!res.ok) throw new Error('Failed to update mode')

        const data = await res.json()
        setConversation(data.conversation)
      } catch (err) {
        console.error('Failed to update mode:', err)
        alert('Failed to switch mode')
      }
    },
    [conversation.id]
  )

  const handlePlatformChange = useCallback(
    async (platform: Platform) => {
      try {
        const res = await fetch(`/api/conversations/${conversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform }),
        })

        if (!res.ok) throw new Error('Failed to update platform')

        const data = await res.json()
        setConversation(data.conversation)
      } catch (err) {
        console.error('Failed to update platform:', err)
        alert('Failed to change platform')
      }
    },
    [conversation.id]
  )

  const handleTitleChange = useCallback(
    async (title: string) => {
      try {
        const res = await fetch(`/api/conversations/${conversation.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })

        if (!res.ok) throw new Error('Failed to update title')

        const data = await res.json()
        setConversation(data.conversation)
      } catch (err) {
        console.error('Failed to update title:', err)
        alert('Failed to update title')
      }
    },
    [conversation.id]
  )

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <ConversationHeader
        conversation={conversation}
        onModeChange={handleModeChange}
        onVoiceChange={setVoiceMode}
        onPlatformChange={handlePlatformChange}
        onTitleChange={handleTitleChange}
        currentVoiceMode={voiceMode}
      />

      {/* Split Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Thread */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <MessageList
            messages={messages}
            streamingText={streamingText}
            isStreaming={isStreaming}
          />
          <MessageInput
            onSend={handleSendMessage}
            disabled={isStreaming}
            mode={conversation.mode}
          />
        </div>

        {/* Right: Context Panel */}
        <div className="w-[40%] overflow-hidden bg-card">
          {conversation.mode === 'explore' ? (
            <SourcePanel sources={retrievedSources} />
          ) : (
            <DraftPreview draft={lastDraft} />
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
