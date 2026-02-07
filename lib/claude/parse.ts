/**
 * Draft Content Parser
 *
 * Extracts draft content from Claude's responses in Draft mode.
 * Parses <draft> tags and separates conversational text from draft content.
 */

// ============================================
// Types
// ============================================

export interface ExtractedDraft {
  platform: string;
  title: string;
  content: string;
}

// ============================================
// Draft Extraction Functions
// ============================================

/**
 * Extract the LAST draft tag from a response
 *
 * When Sonnet produces multiple drafts in one response, the final one
 * is the most recent revision. Returns null if no draft tags found.
 *
 * @param response - Claude's complete response text
 * @returns Extracted draft or null
 */
export function extractDraft(response: string): ExtractedDraft | null {
  const drafts = extractAllDrafts(response);
  return drafts.length > 0 ? drafts[drafts.length - 1] : null;
}

/**
 * Extract ALL draft tags from a response
 *
 * Finds all <draft> tags in the response and returns them as an array.
 * Handles malformed tags gracefully by skipping them.
 *
 * @param response - Claude's complete response text
 * @returns Array of extracted drafts (empty if none found)
 */
export function extractAllDrafts(response: string): ExtractedDraft[] {
  // Regex explanation:
  // <draft\s+ - Match "<draft" followed by whitespace
  // platform="([^"]+)" - Capture platform attribute value
  // \s+ - Required whitespace
  // title="([^"]+)" - Capture title attribute value
  // > - Close opening tag
  // \s*([\s\S]*?)\s* - Capture content (non-greedy), trim whitespace
  // <\/draft> - Match closing tag
  const draftRegex = /<draft\s+platform="([^"]+)"\s+title="([^"]+)">\s*([\s\S]*?)\s*<\/draft>/g;
  const drafts: ExtractedDraft[] = [];
  let match;

  while ((match = draftRegex.exec(response)) !== null) {
    drafts.push({
      platform: match[1],
      title: match[2],
      content: match[3].trim(),
    });
  }

  return drafts;
}

/**
 * Strip all draft tags from a response
 *
 * Returns the conversational portion of the response (everything outside
 * <draft> tags). This is what shows in the chat thread UI.
 *
 * @param response - Claude's complete response text
 * @returns Response with draft tags removed
 */
export function stripDraftTags(response: string): string {
  // Remove all <draft> tags and their content
  return response.replace(/<draft\s+[^>]*>[\s\S]*?<\/draft>/g, '').trim();
}
