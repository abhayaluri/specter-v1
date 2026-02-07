import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { embedText, truncateForEmbedding } from '@/lib/embeddings'

/**
 * POST /api/embed
 * Generate and store embedding for a source
 * Body: { sourceId: string } or { sourceIds: string[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sourceId, sourceIds } = body

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle single source
    if (sourceId) {
      const result = await embedSingleSource(supabase, sourceId, user.id)
      return NextResponse.json(result)
    }

    // Handle batch sources
    if (sourceIds && Array.isArray(sourceIds)) {
      const results = await Promise.allSettled(
        sourceIds.map((id) => embedSingleSource(supabase, id, user.id))
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      return NextResponse.json({
        success: true,
        embedded: succeeded,
        failed,
        total: sourceIds.length,
      })
    }

    return NextResponse.json(
      { error: 'Must provide sourceId or sourceIds' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in /api/embed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate embedding for a single source and store it
 */
async function embedSingleSource(
  supabase: any,
  sourceId: string,
  userId: string
) {
  // Fetch the source
  const { data: source, error: fetchError } = await supabase
    .from('sources')
    .select('id, content, owner_id')
    .eq('id', sourceId)
    .single()

  if (fetchError || !source) {
    throw new Error(`Source not found: ${sourceId}`)
  }

  // Verify ownership
  if (source.owner_id !== userId) {
    throw new Error(`Unauthorized: cannot embed source ${sourceId}`)
  }

  // Generate embedding
  const truncatedContent = truncateForEmbedding(source.content)
  const embedding = await embedText(truncatedContent)

  // Store embedding
  const { error: updateError } = await supabase
    .from('sources')
    .update({ embedding })
    .eq('id', sourceId)

  if (updateError) {
    throw new Error(`Failed to store embedding for source ${sourceId}`)
  }

  return {
    success: true,
    sourceId,
    embeddingDimensions: embedding.length,
  }
}
