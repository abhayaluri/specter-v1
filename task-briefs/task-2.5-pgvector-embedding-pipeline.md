# Task 2.5 — pgvector & Embedding Pipeline

**Status:** NOT STARTED
**Dependencies:** Task 1 (Project Scaffolding — COMPLETE), Task 2 (Supabase Database Setup — COMPLETE)
**Agent type:** Builder
**Estimated effort:** 1 agent session

---

## Objective

Implement the embedding pipeline using OpenAI's `text-embedding-3-small` model. Create utilities to generate embeddings, an API route to embed sources, and integration with the source creation flow. Enable semantic search via the existing `match_sources()` database function.

This is a **coding task.** You are building the embedding system that powers semantic search.

---

## Before You Start

Read these files in order:

1. `technical-architecture-and-database-schema.md` — Embedding architecture (lines 420-431), semantic search (lines 626-665), OpenAI setup
2. `master-implementation-plan.md` — Task 2.5 details (lines 210-245), embedding provider decision (OpenAI text-embedding-3-small)
3. `.env.local` — Check if `OPENAI_API_KEY` is set (may need to add it)
4. `supabase-setup-guide.md` — Database schema, `match_sources()` function details

---

## What's Already Done (Task 2)

- ✅ `sources` table has `embedding vector(1536)` column
- ✅ `match_sources()` function exists in Supabase for semantic search
- ✅ pgvector extension enabled (v0.8.0)
- ✅ OpenAI SDK installed (`openai` package from Task 1)

You're building the **embedding generation pipeline** that populates those embeddings and enables semantic search.

---

## Step-by-Step Instructions

### Step 1: Verify OpenAI API Key

Check `.env.local` for the OpenAI API key. If it's not there, you'll see:

```env
OPENAI_API_KEY=sk-...
```

**If the key is missing:**
- Add a placeholder comment in the code
- The agent can still implement the full pipeline
- Abhay will add the key before testing

**If the key is present:**
- You can test embeddings end-to-end

### Step 2: Create Embedding Utility

Create `lib/embeddings.ts`:

```ts
import OpenAI from 'openai'

// Initialize OpenAI client
// Note: OPENAI_API_KEY must be set in .env.local
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

/**
 * Generate an embedding for a single text string
 * @param text - The text to embed
 * @returns A 1536-dimensional embedding vector
 */
export async function embedText(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty')
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple texts in a single batch
 * @param texts - Array of texts to embed
 * @returns Array of 1536-dimensional embedding vectors
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }

  if (texts.length === 0) {
    return []
  }

  // Filter out empty strings
  const validTexts = texts.filter((t) => t && t.trim().length > 0)

  if (validTexts.length === 0) {
    throw new Error('No valid texts to embed')
  }

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: validTexts,
      encoding_format: 'float',
    })

    return response.data.map((d) => d.embedding)
  } catch (error) {
    console.error('Error generating batch embeddings:', error)
    throw new Error('Failed to generate batch embeddings')
  }
}

/**
 * Truncate text to a reasonable length for embedding
 * OpenAI has an 8191 token limit for text-embedding-3-small
 * @param text - The text to truncate
 * @param maxChars - Maximum characters (default: 8000, roughly 2000 tokens)
 */
export function truncateForEmbedding(text: string, maxChars: number = 8000): string {
  if (text.length <= maxChars) {
    return text
  }

  return text.slice(0, maxChars) + '...'
}
```

This utility:
- Initializes the OpenAI client
- Provides `embedText()` for single embeddings
- Provides `embedBatch()` for bulk operations
- Handles errors (missing API key, empty text, API failures)
- Includes text truncation for long sources

### Step 3: Create the Embed API Route

Replace `app/api/embed/route.ts`:

```ts
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
```

This API route:
- Accepts `sourceId` (single) or `sourceIds` (batch)
- Checks authentication (user must own the source)
- Fetches source content from Supabase
- Generates embedding via OpenAI
- Stores embedding in the `sources.embedding` column
- Returns success/failure status

### Step 4: Add Embedding Hook to Source Creation

When sources are created, they should be automatically embedded. However, **source creation is implemented in Task 6 (Source Capture)**, which hasn't been built yet.

For now, create a **placeholder comment** in `app/api/sources/route.ts` to remind the Task 6 agent:

```ts
// TODO (Task 6): After creating a source, call /api/embed to generate embedding
// Example:
// await fetch('/api/embed', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ sourceId: newSource.id })
// })
```

This ensures the Task 6 agent integrates embeddings into the source creation flow.

### Step 5: Create a Test Script

Create `scripts/test-embeddings.ts` to test the embedding pipeline:

```ts
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
```

Add the required dependencies to run this:

```bash
pnpm add -D tsx dotenv
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test:embeddings": "tsx scripts/test-embeddings.ts"
  }
}
```

### Step 6: Test the Pipeline

**Prerequisites:**
1. Add `OPENAI_API_KEY` to `.env.local` (Abhay needs to provide this)
2. Create at least one test source in the database

**Run the test:**

```bash
pnpm test:embeddings
```

Expected output:
```
🧪 Testing embedding pipeline...

Test 1: Generate embedding for sample text
✅ Generated embedding: 1536 dimensions
   First 5 values: [0.0123, -0.0456, 0.0789, ...]

Test 2: Embed an actual source from database
   Source ID: 123e4567-e89b-12d3-a456-426614174000
   Content preview: This is a test source about...
✅ Embedded and stored for source 123e4567-e89b-12d3-a456-426614174000

Test 3: Test semantic search with match_sources()
✅ Found 1 matches for "artificial intelligence"
   1. [87.3%] This is a test source about AI and machine learning...

✅ All tests passed!
```

### Step 7: Test via API Route (Optional)

If you want to test the API route directly:

1. Start the dev server: `pnpm dev`
2. Create a test source via Supabase dashboard or SQL
3. Call the API:

```bash
curl -X POST http://localhost:3000/api/embed \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "your-source-id-here"}'
```

Expected response:
```json
{
  "success": true,
  "sourceId": "123e4567-e89b-12d3-a456-426614174000",
  "embeddingDimensions": 1536
}
```

### Step 8: Create a Backfill Script (Optional)

For embedding all existing sources in bulk, create `scripts/backfill-embeddings.ts`:

```ts
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
```

Add script to `package.json`:

```json
{
  "scripts": {
    "backfill:embeddings": "tsx scripts/backfill-embeddings.ts"
  }
}
```

### Step 9: Document the System

Add a comment to `lib/embeddings.ts` explaining the embedding pipeline:

```ts
/**
 * Embedding Pipeline for Cambrian Content Engine
 *
 * Overview:
 * - Uses OpenAI text-embedding-3-small (1536 dimensions)
 * - Cost: ~$0.02 per 1M tokens (~$0.10/month expected usage)
 * - Embeddings stored in sources.embedding column (vector(1536))
 * - Semantic search via match_sources() Postgres function
 *
 * Usage:
 * 1. Single embedding: embedText(text) → number[]
 * 2. Batch embedding: embedBatch(texts) → number[][]
 * 3. Via API: POST /api/embed with { sourceId } or { sourceIds }
 *
 * Integration:
 * - Task 6 (Source Capture): Auto-embed on source creation
 * - Task 8a (Explore Mode): Use match_sources() for semantic search
 *
 * Testing:
 * - Run: pnpm test:embeddings
 * - Backfill existing sources: pnpm backfill:embeddings
 */
```

### Step 10: Commit Your Work

```bash
git add -A
git commit -m "Task 2.5: pgvector & embedding pipeline — OpenAI embeddings, API route, test scripts"
```

---

## Output

A complete embedding pipeline with:
- `lib/embeddings.ts` — OpenAI client, embedText(), embedBatch()
- `/api/embed` — API route for single/batch embedding
- Test script to verify embeddings + semantic search
- Backfill script for bulk embedding (optional)
- Documentation for future tasks

---

## Acceptance Criteria

- [ ] `lib/embeddings.ts` created with OpenAI client
- [ ] `embedText()` function works — generates 1536-dim embeddings
- [ ] `embedBatch()` function works — handles multiple texts
- [ ] `/api/embed` route works — accepts sourceId or sourceIds
- [ ] Embeddings are stored in `sources.embedding` column
- [ ] `match_sources()` semantic search works with stored embeddings
- [ ] Test script runs successfully (`pnpm test:embeddings`)
- [ ] Error handling: missing OpenAI key, API failures, source not found
- [ ] Placeholder comment added to `/api/sources/route.ts` for Task 6
- [ ] No TypeScript errors (`pnpm tsc --noEmit` passes)
- [ ] Git committed with proper message

---

## Reference Files

| File | What to look at |
|------|----------------|
| `technical-architecture-and-database-schema.md` | Embedding architecture (lines 420-431), match_sources() function (lines 626-665) |
| `master-implementation-plan.md` | Task 2.5 details (lines 210-245), OpenAI decision |
| `.env.local` | OPENAI_API_KEY (add if missing) |
| `supabase-setup-guide.md` | Database schema, sources table, match_sources() function |

---

## Notes for the Agent

- **OpenAI SDK already installed** — it was added in Task 1 (`openai` package)
- **OPENAI_API_KEY may not be set yet** — Abhay needs to add it. If it's missing, implement the full pipeline anyway and add error handling. You can test once the key is added.
- **pgvector is already enabled** — Task 2 set up the extension and the `match_sources()` function
- **The `sources.embedding` column exists** — it's a `vector(1536)` column ready to receive embeddings
- **Cost is negligible** — OpenAI text-embedding-3-small is $0.02 per 1M tokens. Expected usage: ~$0.10/month.
- **Task 6 will integrate auto-embedding** — When sources are created in Task 6, they should call `/api/embed` automatically. Add a TODO comment for the Task 6 agent.
- **Truncation is important** — OpenAI has an 8191 token limit. The `truncateForEmbedding()` function handles this.
- **Batch operations are more efficient** — Use `embedBatch()` when embedding multiple sources (e.g., backfill script)
- **Semantic search is already implemented** — The `match_sources()` function in Supabase does cosine similarity search. You're just populating the embeddings.
- **Test with real sources** — The test script assumes at least one source exists in the database. If not, create one via SQL or Supabase dashboard.

---

## Testing Checklist

- [ ] `embedText()` generates 1536-dimensional embedding
- [ ] `embedBatch()` handles multiple texts correctly
- [ ] POST /api/embed with `sourceId` embeds and stores successfully
- [ ] POST /api/embed with `sourceIds` handles batch correctly
- [ ] Stored embedding appears in `sources.embedding` column
- [ ] `match_sources()` returns semantically similar sources
- [ ] Test script (`pnpm test:embeddings`) passes all 3 tests
- [ ] Error handling works (missing API key, empty text, source not found)
- [ ] No TypeScript errors or console warnings

---

## OpenAI API Key Setup (for Abhay)

Add to `.env.local`:

```env
OPENAI_API_KEY=sk-proj-...
```

Get your API key from: https://platform.openai.com/api-keys

Verify it works:
```bash
pnpm test:embeddings
```

Expected cost: ~$0.10/month for typical usage.
