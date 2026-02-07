/**
 * Backfill embeddings for all sources without embeddings
 * Run with: pnpm tsx scripts/backfill-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import { embedBatch, truncateForEmbedding } from '../lib/embeddings'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function backfillEmbeddings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('🔄 Backfilling embeddings...\n')

  // Fetch all sources without embeddings
  const { data: sources, error: fetchError } = await supabase
    .from('sources')
    .select('id, content')
    .is('embedding', null)

  if (fetchError) {
    console.error('❌ Failed to fetch sources:', fetchError)
    return
  }

  if (!sources || sources.length === 0) {
    console.log('✅ No sources need embeddings. All done!')
    return
  }

  console.log(`Found ${sources.length} sources without embeddings`)

  // Process in batches of 100 (OpenAI batch limit is 2048)
  const batchSize = 100
  let processed = 0

  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize)
    const texts = batch.map((s) => truncateForEmbedding(s.content))

    try {
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`)
      const embeddings = await embedBatch(texts)

      // Store embeddings
      for (let j = 0; j < batch.length; j++) {
        await supabase
          .from('sources')
          .update({ embedding: embeddings[j] })
          .eq('id', batch[j].id)
      }

      processed += batch.length
      console.log(`✅ Processed ${processed}/${sources.length}`)
    } catch (error) {
      console.error(`❌ Failed to process batch:`, error)
    }
  }

  console.log(`\n✅ Backfill complete! Embedded ${processed} sources.`)
}

backfillEmbeddings().catch(console.error)
