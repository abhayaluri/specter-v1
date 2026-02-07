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

import OpenAI from 'openai'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

// Lazy initialization of OpenAI client
// This ensures environment variables are loaded before creating the client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

/**
 * Generate an embedding for a single text string
 * @param text - The text to embed
 * @returns A 1536-dimensional embedding vector
 */
export async function embedText(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty')
  }

  try {
    const openai = getOpenAIClient()
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
  if (texts.length === 0) {
    return []
  }

  // Filter out empty strings
  const validTexts = texts.filter((t) => t && t.trim().length > 0)

  if (validTexts.length === 0) {
    throw new Error('No valid texts to embed')
  }

  try {
    const openai = getOpenAIClient()
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
