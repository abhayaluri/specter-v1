'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ConversationMode } from '@/lib/types'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  mode: ConversationMode
}

/**
 * Message Input Component
 *
 * Auto-growing textarea with send button.
 * - Cmd+Enter (Mac) or Ctrl+Enter to send
 * - Disabled while streaming
 * - Placeholder changes by mode
 */
export default function MessageInput({ onSend, disabled = false, mode }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed || disabled) return

    onSend(trimmed)
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const placeholder =
    mode === 'explore'
      ? 'Explore an angle, connect ideas...'
      : 'What should we draft for this platform?'

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex gap-2 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
        >
          {disabled ? 'Sending...' : 'Send'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {!disabled && (
          <>
            Press <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs">⌘</kbd>{' '}
            + <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs">Enter</kbd> to send
          </>
        )}
      </p>
    </div>
  )
}
