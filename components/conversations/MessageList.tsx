'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/types'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  streamingText?: string
  isStreaming?: boolean
}

/**
 * Message List Component
 *
 * Scrollable list of messages with auto-scroll to bottom.
 * - Displays message history
 * - Shows streaming assistant message while streaming
 * - Auto-scrolls to bottom on new messages
 */
export default function MessageList({
  messages,
  streamingText = '',
  isStreaming = false,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(messages.length)

  // Auto-scroll to bottom when new messages arrive or streaming updates
  useEffect(() => {
    if (scrollRef.current) {
      const hasNewMessage = messages.length > prevMessageCountRef.current
      const shouldScroll = hasNewMessage || isStreaming

      if (shouldScroll) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }

      prevMessageCountRef.current = messages.length
    }
  }, [messages.length, streamingText, isStreaming])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-4xl mb-4">💬</div>
          <h3 className="font-medium text-foreground mb-2">Start a conversation</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Send a message to begin exploring angles or drafting content
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6 space-y-4"
    >
      {/* Message history */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Streaming assistant message (temporary, not persisted yet) */}
      {isStreaming && streamingText && (
        <MessageBubble
          message={{
            id: 'streaming',
            conversation_id: '',
            role: 'assistant',
            content: streamingText,
            draft_content: null,
            created_at: new Date().toISOString(),
          }}
          isStreaming
        />
      )}
    </div>
  )
}
