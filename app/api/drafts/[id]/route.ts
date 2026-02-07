import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/drafts/[id]
 *
 * Fetch draft with version history.
 * Returns: { draft: Draft, versions: DraftVersion[] }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch draft
  const { data: draft, error: draftError } = await supabase
    .from('drafts')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (draftError || !draft) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  // Fetch versions
  const { data: versions, error: versionsError } = await supabase
    .from('draft_versions')
    .select('*')
    .eq('draft_id', id)
    .order('version', { ascending: false })

  if (versionsError) {
    console.error('Failed to fetch versions:', versionsError)
  }

  return NextResponse.json({ draft, versions: versions || [] })
}

/**
 * PATCH /api/drafts/[id]
 *
 * Update a draft. Two use cases:
 * 1. Content update (user revises draft) — increment version, save to draft_versions
 * 2. Metadata update (title, status, platform) — no version increment
 *
 * Body: { title?, content?, status?, platform? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, content, status, platform } = body

  // Fetch current draft to check ownership
  const { data: currentDraft, error: fetchError } = await supabase
    .from('drafts')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !currentDraft) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  const updates: Record<string, any> = {}

  // Content update → increment version, create version row
  if (content !== undefined && content !== currentDraft.content) {
    const newVersion = currentDraft.version + 1
    updates.content = content
    updates.version = newVersion

    // Create version history entry
    await supabase.from('draft_versions').insert({
      draft_id: id,
      version: newVersion,
      content,
    })
  }

  // Metadata updates (no version increment)
  if (title !== undefined) updates.title = title
  if (status !== undefined) {
    const validStatuses = ['draft', 'ready', 'published']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updates.status = status
  }
  if (platform !== undefined) {
    const validPlatforms = ['linkedin', 'twitter', 'longform', 'shortform']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }
    updates.platform = platform
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  // Update draft
  const { data: updatedDraft, error: updateError } = await supabase
    .from('drafts')
    .update(updates)
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ draft: updatedDraft })
}

/**
 * DELETE /api/drafts/[id]
 *
 * Delete a draft and all its versions (cascade).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new Response(null, { status: 204 })
}
