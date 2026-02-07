import { notFound } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import BucketDetailView from '@/components/buckets/BucketDetailView'

async function getBucketDetail(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Fetch bucket detail
  const detailRes = await fetch(`${baseUrl}/api/buckets/${id}`, {
    cache: 'no-store',
  })

  if (!detailRes.ok) {
    notFound()
  }

  const detailData = await detailRes.json()

  // Fetch all buckets for the "Move" dropdown
  const bucketsRes = await fetch(`${baseUrl}/api/buckets`, {
    cache: 'no-store',
  })

  const bucketsData = await bucketsRes.json()

  return {
    bucket: detailData.bucket,
    sources: detailData.sources,
    drafts: detailData.drafts,
    conversations: detailData.conversations,
    allBuckets: bucketsData.buckets ?? [],
  }
}

export default async function BucketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getBucketDetail(id)

  return (
    <AppShell>
      <BucketDetailView
        initialBucket={data.bucket}
        initialSources={data.sources}
        initialDrafts={data.drafts}
        initialConversations={data.conversations}
        allBuckets={data.allBuckets}
      />
    </AppShell>
  )
}
