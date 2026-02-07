import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('sources')
    .select('*, buckets(name)')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({
    source: { ...data, bucket_name: data.buckets?.name ?? null, buckets: undefined }
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, any> = {}
  if (body.content !== undefined) updates.content = body.content
  if (body.sourceType !== undefined) updates.source_type = body.sourceType
  if (body.sourceUrl !== undefined) updates.source_url = body.sourceUrl
  if (body.bucketId !== undefined) updates.bucket_id = body.bucketId

  // Handle title updates in metadata
  if (body.title !== undefined) {
    // Fetch current metadata to merge
    const { data: currentSource } = await supabase
      .from('sources')
      .select('metadata')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    const currentMetadata = currentSource?.metadata || {}
    updates.metadata = { ...currentMetadata, title: body.title }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sources')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If content changed, re-embed
  if (updates.content) {
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({ sourceId: id }),
    }).catch((err) => console.error('Re-embedding failed:', err))
  }

  return NextResponse.json({ source: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
