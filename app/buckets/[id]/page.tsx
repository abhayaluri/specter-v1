import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import BucketDetailView from '@/components/buckets/BucketDetailView'

export default async function BucketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch bucket directly — no API route needed
  const { data: bucket, error } = await supabase
    .from('buckets')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !bucket) notFound()

  // Fetch sources in this bucket
  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .eq('bucket_id', id)
    .order('created_at', { ascending: false })

  // Fetch drafts in this bucket
  const { data: drafts } = await supabase
    .from('drafts')
    .select('*')
    .eq('bucket_id', id)
    .order('created_at', { ascending: false })

  // Fetch conversations for this bucket
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('bucket_id', id)
    .order('updated_at', { ascending: false })

  // Fetch all buckets (for "Move to bucket" dropdown in SourceCards)
  const { data: allBuckets } = await supabase
    .from('buckets')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <AppShell>
      <BucketDetailView
        initialBucket={bucket}
        initialSources={sources ?? []}
        initialDrafts={drafts ?? []}
        initialConversations={conversations ?? []}
        allBuckets={allBuckets ?? []}
      />
    </AppShell>
  )
}
