/**
 * Anthropic API Client Factory
 *
 * Shared helper for creating Anthropic clients across Explore and Draft modes.
 * Takes a decrypted API key and returns an initialized client.
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Create an Anthropic client with the provided API key
 * @param apiKey - Decrypted Anthropic API key
 * @returns Initialized Anthropic client
 */
export function createAnthropicClient(apiKey: string): Anthropic {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key is required');
  }

  return new Anthropic({ apiKey });
}
