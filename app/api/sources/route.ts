import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Generate a simple title from content (first 60-80 chars, cut at word boundary)
 */
function generateSimpleTitle(content: string): string {
  if (!content) return 'Untitled'

  // Remove extra whitespace and newlines
  const cleaned = content.trim().replace(/\s+/g, ' ')

  // If content is short enough, use as-is
  if (cleaned.length <= 60) return cleaned

  // Truncate at ~60-80 chars, cutting at word boundary
  const truncated = cleaned.slice(0, 80)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > 50) {
    return truncated.slice(0, lastSpace) + '...'
  }

  return truncated + '...'
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const bucketId = searchParams.get('bucketId')
  const inbox = searchParams.get('inbox')

  let query = supabase
    .from('sources')
    .select('*, buckets(name)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (inbox === 'true') {
    query = query.is('bucket_id', null)
  } else if (bucketId) {
    query = query.eq('bucket_id', bucketId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten joined bucket name
  const sources = (data ?? []).map((s: any) => ({
    ...s,
    bucket_name: s.buckets?.name ?? null,
    buckets: undefined,
  }))

  return NextResponse.json({ sources })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Support bulk creation (array of sources)
  const items = Array.isArray(body) ? body : [body]

  const sourcesToInsert = items.map((item: any) => {
    // Auto-generate title from content if not provided
    const autoTitle = item.title || generateSimpleTitle(item.content)

    return {
      content: item.content,
      source_type: item.sourceType || 'note',
      source_url: item.sourceUrl || null,
      bucket_id: item.bucketId || null,
      owner_id: user.id,
      metadata: { ...item.metadata, title: autoTitle },
    }
  })

  const { data, error } = await supabase
    .from('sources')
    .insert(sourcesToInsert)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire-and-forget: trigger embedding generation for all new sources
  const sourceIds = (data ?? []).map((s: any) => s.id)
  if (sourceIds.length > 0) {
    // Use absolute URL for server-side fetch
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ sourceIds }),
    }).catch((err) => console.error('Embedding generation failed:', err))
  }

  return NextResponse.json(
    { sources: data, count: data?.length ?? 0 },
    { status: 201 }
  )
}
