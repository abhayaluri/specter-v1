// ============================================
// Database entity types
// ============================================

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  anthropic_api_key_encrypted: string | null;
  personal_voice_profile: string[];
  explore_model: string;
  draft_model: string;
  created_at: string;
  updated_at: string;
}

export interface VoiceConfig {
  id: string;
  type: 'company' | 'platform';
  platform: 'linkedin' | 'twitter' | 'longform' | 'shortform' | null;
  rules: string[];
  updated_by: string | null;
  updated_at: string;
}

export interface Bucket {
  id: string;
  name: string;
  description: string | null;
  color: string;
  owner_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  source_count?: number;
  draft_count?: number;
}

export type SourceType = 'note' | 'link' | 'voice_memo' | 'podcast_note' | 'article_clip' | 'tweet';

export interface Source {
  id: string;
  bucket_id: string | null;
  owner_id: string;
  content: string;
  source_type: SourceType;
  source_url: string | null;
  metadata: {
    title?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
  // Joined fields
  bucket_name?: string;
  owner_name?: string;
}

export type Platform = 'linkedin' | 'twitter' | 'longform' | 'shortform';
export type DraftStatus = 'draft' | 'ready' | 'published';
export type ConversationMode = 'explore' | 'draft';

export interface Conversation {
  id: string;
  bucket_id: string | null;
  owner_id: string;
  title: string | null;
  include_all_buckets: boolean;
  platform: Platform | null;
  mode: ConversationMode;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  draft_content: string | null;
  created_at: string;
}

export interface Draft {
  id: string;
  conversation_id: string | null;
  bucket_id: string | null;
  owner_id: string;
  title: string;
  platform: Platform;
  status: DraftStatus;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface DraftVersion {
  id: string;
  draft_id: string;
  version: number;
  content: string;
  created_at: string;
}

// ============================================
// Input types for API calls
// ============================================

export interface CreateSourceInput {
  content: string;
  title?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  bucketId?: string;
}

export interface CreateBucketInput {
  name: string;
  description?: string;
  color?: string;
}

export interface SendMessageInput {
  conversationId: string;
  message: string;
  mode: ConversationMode;
  bucketId?: string;
  includeAllBuckets?: boolean;
  platform?: Platform;
  manualSourceIds?: string[];
  voiceMode?: 'personal' | 'compound';
}

// ============================================
// Display config constants
// ============================================

export const PLATFORM_CONFIG: Record<Platform, { label: string; icon: string; desc: string; color: string }> = {
  linkedin: { label: 'LinkedIn', icon: 'in', desc: 'Professional, insight-driven', color: '#0A66C2' },
  twitter: { label: 'Twitter / X', icon: '𝕏', desc: 'Punchy, provocative', color: '#1C1C1C' },
  longform: { label: 'Long-form', icon: '¶', desc: 'Narrative depth, 2-4k words', color: '#8B6914' },
  shortform: { label: 'Short-form', icon: '§', desc: 'Tight argument, 500-1k words', color: '#5B7553' },
};

export const BUCKET_COLORS = [
  '#E8B931', '#4A9EDE', '#D4594E', '#9B59B6',
  '#2ECC71', '#E67E22', '#1ABC9C', '#E74C3C',
  '#3498DB', '#F39C12',
];
