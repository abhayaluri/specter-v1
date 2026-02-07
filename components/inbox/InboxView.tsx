'use client'

import { useState, useEffect } from 'react'
import { Source } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useCaptureModal } from '@/components/capture/CaptureProvider'
import SourceCard from './SourceCard'

export default function InboxView() {
  const [sources, setSources] = useState<Source[]>([])
  const [buckets, setBuckets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { openCapture, captureVersion } = useCaptureModal()

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/sources?inbox=true')
      const data = await res.json()
      if (data.sources) setSources(data.sources)
    } catch (err) {
      console.error('Failed to fetch sources:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBuckets = async () => {
    try {
      const res = await fetch('/api/buckets')
      const data = await res.json()
      if (data.buckets) setBuckets(data.buckets)
    } catch (err) {
      // Bucket API doesn't exist yet (Task 7) - that's ok
    }
  }

  useEffect(() => {
    fetchSources()
    fetchBuckets()
  }, [captureVersion])  // refetch when capture happens

  const handleDelete = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id))
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-[32px] tracking-tight text-foreground mb-6">
            Inbox
          </h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (sources.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-[32px] tracking-tight text-foreground mb-6">
            Inbox
          </h1>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/50 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h2 className="font-display text-xl text-foreground mb-2">Your inbox is empty</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Capture ideas with <kbd className="px-1.5 py-0.5 bg-accent rounded text-xs font-mono">Cmd+K</kbd> or the + button
            </p>
            <Button onClick={openCapture}>
              Capture
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-[32px] tracking-tight text-foreground">
            Inbox ({sources.length})
          </h1>
        </div>

        {/* Source list */}
        <div className="space-y-3">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              buckets={buckets}
              onUpdate={fetchSources}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
