import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/drafts
 *
 * List user's drafts with optional filters.
 * Query params: ?conversationId=X, ?platform=linkedin, ?status=draft
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  const platform = searchParams.get('platform')
  const status = searchParams.get('status')

  let query = supabase
    .from('drafts')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (conversationId) query = query.eq('conversation_id', conversationId)
  if (platform) query = query.eq('platform', platform)
  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ drafts: data || [] })
}

/**
 * POST /api/drafts
 *
 * Create a new draft (the "Save to Drafts" action).
 * Body: { title, platform, content, conversationId?, bucketId? }
 * Creates draft row (version=1, status='draft') + initial draft_versions row.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, platform, content, conversationId, bucketId } = body

  // Validation
  if (!title || !platform || !content) {
    return NextResponse.json(
      { error: 'Missing required fields: title, platform, content' },
      { status: 400 }
    )
  }

  const validPlatforms = ['linkedin', 'twitter', 'longform', 'shortform']
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  // Create draft
  const { data: draft, error: draftError } = await supabase
    .from('drafts')
    .insert({
      owner_id: user.id,
      conversation_id: conversationId || null,
      bucket_id: bucketId || null,
      title,
      platform,
      content,
      version: 1,
      status: 'draft',
    })
    .select()
    .single()

  if (draftError) {
    return NextResponse.json({ error: draftError.message }, { status: 500 })
  }

  // Create initial version
  const { error: versionError } = await supabase
    .from('draft_versions')
    .insert({
      draft_id: draft.id,
      version: 1,
      content,
    })

  if (versionError) {
    console.error('Failed to create draft version:', versionError)
    // Don't fail the request — draft is created, version is optional
  }

  return NextResponse.json({ draft }, { status: 201 })
}
