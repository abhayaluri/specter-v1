/**
 * Test script for embedding pipeline
 * Run with: pnpm tsx scripts/test-embeddings.ts
 *
 * Prerequisites:
 * 1. OPENAI_API_KEY must be set in .env.local
 * 2. At least one source must exist in the database
 * 3. User must be authenticated (use Supabase service role key)
 */

import { createClient } from '@supabase/supabase-js'
import { embedText } from '../lib/embeddings'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testEmbeddings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🧪 Testing embedding pipeline...\n')

  // Test 1: Generate a test embedding
  console.log('Test 1: Generate embedding for sample text')
  const sampleText = 'This is a test document about artificial intelligence and machine learning.'

  try {
    const embedding = await embedText(sampleText)
    console.log(`✅ Generated embedding: ${embedding.length} dimensions`)
    console.log(`   First 5 values: [${embedding.slice(0, 5).join(', ')}...]`)
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error)
    return
  }

  // Test 2: Fetch a source and embed it
  console.log('\nTest 2: Embed an actual source from database')

  const { data: sources, error: fetchError } = await supabase
    .from('sources')
    .select('id, content')
    .limit(1)

  if (fetchError || !sources || sources.length === 0) {
    console.log('⚠️  No sources found in database. Create a source first.')
    return
  }

  const source = sources[0]
  console.log(`   Source ID: ${source.id}`)
  console.log(`   Content preview: ${source.content.slice(0, 100)}...`)

  try {
    const embedding = await embedText(source.content)

    // Store it
    const { error: updateError } = await supabase
      .from('sources')
      .update({ embedding })
      .eq('id', source.id)

    if (updateError) {
      console.error('❌ Failed to store embedding:', updateError)
      return
    }

    console.log(`✅ Embedded and stored for source ${source.id}`)
  } catch (error) {
    console.error('❌ Failed to embed source:', error)
    return
  }

  // Test 3: Test semantic search
  console.log('\nTest 3: Test semantic search with match_sources()')

  const queryText = 'artificial intelligence'
  const queryEmbedding = await embedText(queryText)

  const { data: matches, error: searchError } = await supabase.rpc('match_sources', {
    query_embedding: queryEmbedding,
    match_threshold: 0.5,
    match_count: 5,
  })

  if (searchError) {
    console.error('❌ Semantic search failed:', searchError)
    return
  }

  console.log(`✅ Found ${matches?.length || 0} matches for "${queryText}"`)
  matches?.forEach((match: any, i: number) => {
    console.log(`   ${i + 1}. [${(match.similarity * 100).toFixed(1)}%] ${match.content.slice(0, 60)}...`)
  })

  console.log('\n✅ All tests passed!')
}

testEmbeddings().catch(console.error)
