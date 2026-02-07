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

  // Fetch the bucket
  const { data: bucket, error } = await supabase
    .from('buckets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

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

  return NextResponse.json({
    bucket,
    sources: sources ?? [],
    drafts: drafts ?? [],
    conversations: conversations ?? [],
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
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.description !== undefined) updates.description = body.description?.trim() || null
  if (body.color !== undefined) updates.color = body.color
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('buckets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bucket: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Note: sources with this bucket_id will have bucket_id set to NULL (ON DELETE SET NULL)
  // This moves them back to the inbox, which is the correct behavior.
  const { error } = await supabase
    .from('buckets')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
