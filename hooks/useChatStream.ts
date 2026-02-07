import { useState, useCallback, useRef } from 'react'
import { SendMessageInput } from '@/lib/types'
import { RetrievedSource } from '@/lib/claude/prompts'
import { ExtractedDraft } from '@/lib/claude/parse'

/**
 * SSE Chat Streaming Hook
 *
 * Handles streaming responses from POST /api/chat.
 * Parses SSE events and manages streaming state.
 */

interface UseChatStreamOptions {
  onComplete?: (messageId: string, draft: ExtractedDraft | null) => void
  onError?: (error: string) => void
}

interface UseChatStreamReturn {
  sendMessage: (input: SendMessageInput) => void
  isStreaming: boolean
  streamingText: string
  retrievedSources: RetrievedSource[]
  lastDraft: ExtractedDraft | null
  error: string | null
}

export function useChatStream(options: UseChatStreamOptions = {}): UseChatStreamReturn {
  const { onComplete, onError } = options

  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [retrievedSources, setRetrievedSources] = useState<RetrievedSource[]>([])
  const [lastDraft, setLastDraft] = useState<ExtractedDraft | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Abort controller for canceling in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (input: SendMessageInput) => {
    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Reset state
    setIsStreaming(true)
    setStreamingText('')
    setError(null)

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // Parse SSE stream
      await parseSSEStream(response.body, {
        onSources: (sources) => {
          setRetrievedSources(sources)
        },
        onText: (text) => {
          setStreamingText((prev) => prev + text)
        },
        onDone: (messageId, draft) => {
          setIsStreaming(false)
          setLastDraft(draft)
          onComplete?.(messageId, draft)
        },
        onError: (errorMsg) => {
          setIsStreaming(false)
          setError(errorMsg)
          onError?.(errorMsg)
        },
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Intentional abort, not an error
        setIsStreaming(false)
        return
      }

      const errorMsg = err instanceof Error ? err.message : 'Failed to send message'
      setIsStreaming(false)
      setError(errorMsg)
      onError?.(errorMsg)
    }
  }, [onComplete, onError])

  return {
    sendMessage,
    isStreaming,
    streamingText,
    retrievedSources,
    lastDraft,
    error,
  }
}

/**
 * Parse SSE stream from ReadableStream
 *
 * Handles buffering of incomplete events (chunks may split mid-JSON)
 */
interface SSECallbacks {
  onSources: (sources: RetrievedSource[]) => void
  onText: (text: string) => void
  onDone: (messageId: string, draft: ExtractedDraft | null) => void
  onError: (error: string) => void
}

async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  callbacks: SSECallbacks
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Split on double newline (SSE message delimiter)
      const messages = buffer.split('\n\n')

      // Keep the last incomplete message in the buffer
      buffer = messages.pop() || ''

      // Process complete messages
      for (const message of messages) {
        if (!message.trim()) continue

        // Extract data line (format: "data: {JSON}")
        const dataMatch = message.match(/^data: (.+)$/m)
        if (!dataMatch) continue

        try {
          const event = JSON.parse(dataMatch[1])

          switch (event.type) {
            case 'sources':
              callbacks.onSources(event.sources || [])
              break
            case 'text':
              callbacks.onText(event.text || '')
              break
            case 'done':
              callbacks.onDone(event.messageId, event.draft || null)
              break
            case 'error':
              callbacks.onError(event.error || 'Unknown error')
              break
          }
        } catch (parseError) {
          console.error('Failed to parse SSE event:', parseError, dataMatch[1])
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
