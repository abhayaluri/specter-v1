/**
 * Auto-Title Generation for Conversations
 *
 * Generates a concise 3-6 word title for conversations after the first exchange.
 * Uses Haiku for speed and low cost. Fire-and-forget from the chat router.
 */

import { createAnthropicClient } from './client';
import { createClient } from '@/lib/supabase/server';

/**
 * Generate a title for a conversation based on the first exchange
 *
 * This function is fire-and-forget — errors are logged but do not block the main flow.
 * If title generation fails, the conversation simply keeps its null title.
 *
 * @param params.firstUserMessage - The first user message
 * @param params.firstAssistantResponse - First ~500 chars of assistant's response
 * @param params.apiKey - Decrypted Anthropic API key
 * @param params.conversationId - Conversation ID to update
 */
export async function generateConversationTitle(params: {
  firstUserMessage: string;
  firstAssistantResponse: string;
  apiKey: string;
  conversationId: string;
}): Promise<void> {
  const { firstUserMessage, firstAssistantResponse, apiKey, conversationId } = params;

  try {
    // Create Anthropic client
    const client = createAnthropicClient(apiKey);

    // Truncate assistant response to ~500 chars for context
    const responsePreview =
      firstAssistantResponse.length > 500
        ? firstAssistantResponse.slice(0, 500) + '...'
        : firstAssistantResponse;

    // Generate title using Haiku (fast and cheap)
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Generate a concise 3-6 word title for this conversation.

User's message: ${firstUserMessage}

Assistant's response: ${responsePreview}

Return ONLY the title, nothing else. No quotes, no punctuation unless part of the title.`,
        },
      ],
    });

    // Extract title from response
    const title =
      response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : 'Untitled Conversation';

    // Update conversation in database
    const supabase = await createClient();
    await supabase.from('conversations').update({ title }).eq('id', conversationId);

    console.log(`Generated title for conversation ${conversationId}: "${title}"`);
  } catch (error) {
    // Log error but don't throw — title generation is nice-to-have, not critical
    console.error('Failed to generate conversation title:', error);
  }
}
