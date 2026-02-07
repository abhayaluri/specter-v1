import { Message } from '@/lib/types'
import { stripDraftTags } from '@/lib/claude/parse'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
}

/**
 * Message Bubble Component
 *
 * Displays a single message in the chat thread.
 * - User messages: right-aligned with distinct styling
 * - Assistant messages: left-aligned with markdown rendering
 * - In Draft mode: strips <draft> tags from assistant messages (draft content shown in DraftPreview)
 */
export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  // For assistant messages, strip draft tags (conversational text only)
  const displayContent = isUser ? message.content : stripDraftTags(message.content)

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border',
          isStreaming && 'animate-pulse'
        )}
      >
        {isUser ? (
          // User messages: plain text
          <p className="whitespace-pre-wrap break-words">{displayContent}</p>
        ) : (
          // Assistant messages: rendered markdown
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                // Custom rendering for markdown elements
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-3">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 mb-3">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
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
              }}
            >
              {displayContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
