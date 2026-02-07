'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bucket } from '@/lib/types'
import { relativeTime } from '@/lib/format'
import { Button } from '@/components/ui/button'
import CreateBucketModal from './CreateBucketModal'

export default function BucketListView() {
  const router = useRouter()
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchBuckets = async () => {
    try {
      const res = await fetch('/api/buckets')
      if (!res.ok) throw new Error('Failed to fetch buckets')
      const data = await res.json()
      setBuckets(data.buckets ?? [])
    } catch (err) {
      console.error('Fetch buckets failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBuckets()
  }, [])

  const handleBucketClick = (bucketId: string) => {
    router.push(`/buckets/${bucketId}`)
  }

  const handleBucketCreated = () => {
    fetchBuckets()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-muted-foreground">Loading buckets...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1>Buckets</h1>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          New Bucket
        </Button>
      </div>

      {/* Empty State */}
      {buckets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)] text-center">
          <div className="space-y-4">
            <h3 className="text-muted-foreground">No buckets yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Create your first bucket to start organizing sources
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              New Bucket
            </Button>
          </div>
        </div>
      ) : (
        /* Bucket Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((bucket) => (
            <div
              key={bucket.id}
              onClick={() => handleBucketClick(bucket.id)}
              className="bg-card border border-border rounded-lg p-5 hover:border-border-light transition-colors cursor-pointer group"
            >
              {/* Header with color indicator */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                  style={{ backgroundColor: bucket.color }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {bucket.name}
                  </h3>
                </div>
              </div>

              {/* Description */}
              {bucket.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {bucket.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{bucket.source_count ?? 0} sources</span>
                <span>{bucket.draft_count ?? 0} drafts</span>
                {bucket.updated_at && (
                  <span className="ml-auto">{relativeTime(bucket.updated_at)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateBucketModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreated={handleBucketCreated}
        existingBuckets={buckets}
      />
    </div>
  )
}
