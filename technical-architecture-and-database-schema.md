# Architecture — Cambrian Content Engine

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Next.js)                     │
│                                                          │
│  ┌──────────────┐    ┌───────────────────────────────┐  │
│  │   App Router  │    │       API Route Handlers      │  │
│  │  (React SSR   │    │                               │  │
│  │   + Client)   │◄──►│  /api/chat     → Claude API   │  │
│  │               │    │  /api/embed    → Embeddings   │  │
│  │               │    │  /api/sources  → Supabase     │  │
│  │               │    │  /api/buckets  → Supabase     │  │
│  │               │    │  /api/drafts   → Supabase     │  │
│  │               │    │  /api/settings → Supabase     │  │
│  └──────┬───────┘    └───────────┬───────────────────┘  │
│         │                         │                      │
└─────────┼─────────────────────────┼──────────────────────┘
          │                         │
          │  Supabase JS (anon)     │  Supabase JS (service role)
          │                         │  + Anthropic SDK
          │                         │  + Embedding API (OpenAI)
          ▼                         ▼
┌─────────────────────────────────────────────────────────┐
│                       Supabase                           │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐    │
│  │   Auth    │  │ Postgres │  │     Realtime       │    │
│  │          │  │ +pgvector│  │  (subscriptions)    │    │
│  └──────────┘  └──────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Full SQL Migration

Run this in the Supabase SQL editor to set up the database:

```sql
-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  anthropic_api_key_encrypted text,
  personal_voice_profile text[] default '{}',
  explore_model text default 'claude-opus-4-5-20250929',
  draft_model text default 'claude-sonnet-4-20250514',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- VOICE CONFIG (shared company + platform voices)
-- ============================================
create table public.voice_config (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('company', 'platform')),
  platform text check (
    (type = 'company' and platform is null) or
    (type = 'platform' and platform in ('linkedin', 'twitter', 'longform', 'shortform'))
  ),
  rules text[] not null default '{}',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz default now()
);

-- Seed default voice configs
insert into public.voice_config (type, platform, rules) values
  ('company', null, '{}'),
  ('platform', 'linkedin', '{"Professional, insight-driven", "Hook in the first line", "1300 character preview limit", "Short paragraphs, 2-3 sentences max"}'),
  ('platform', 'twitter', '{"Punchy, provocative", "280 chars per tweet", "Thread format for longer takes", "Each tweet should stand alone"}'),
  ('platform', 'longform', '{"Narrative depth, 2-4k words", "Section headers for structure", "Storytelling arc with examples", "Credits sources by name"}'),
  ('platform', 'shortform', '{"Tight argument, 500-1k words", "One core thesis", "Contrarian framing", "End with a reframe"}');

-- ============================================
-- BUCKETS
-- ============================================
create table public.buckets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text not null default '#4A9EDE',
  owner_id uuid references public.profiles(id) not null,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable pgvector extension
create extension if not exists vector;

-- ============================================
-- SOURCES
-- ============================================
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  bucket_id uuid references public.buckets(id) on delete set null,
  owner_id uuid references public.profiles(id) not null,
  content text not null,
  source_type text not null check (source_type in ('note', 'link', 'voice_memo', 'podcast_note', 'article_clip', 'tweet')),
  source_url text,
  embedding vector(1536), -- for semantic search via pgvector
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Embedding index for semantic search (add when source count exceeds 1000)
-- create index idx_sources_embedding on public.sources
--   using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);

-- ============================================
-- CONVERSATIONS
-- ============================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  bucket_id uuid references public.buckets(id) on delete set null,
  owner_id uuid references public.profiles(id) not null,
  title text,
  include_all_buckets boolean default true, -- cross-bucket semantic search is the default
  platform text check (platform in ('linkedin', 'twitter', 'longform', 'shortform')),
  mode text default 'explore' check (mode in ('explore', 'draft')), -- last-used mode for UI restoration; authoritative mode comes per-request
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- MESSAGES
-- ============================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  draft_content text,
  created_at timestamptz default now()
);

-- Index for fast message retrieval by conversation
create index idx_messages_conversation on public.messages(conversation_id, created_at);

-- ============================================
-- DRAFTS
-- ============================================
create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  bucket_id uuid references public.buckets(id) on delete set null,
  owner_id uuid references public.profiles(id) not null,
  title text not null,
  platform text not null check (platform in ('linkedin', 'twitter', 'longform', 'shortform')),
  status text not null default 'draft' check (status in ('draft', 'ready', 'published')),
  content text not null default '',
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- DRAFT VERSIONS
-- ============================================
create table public.draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references public.drafts(id) on delete cascade not null,
  version int not null,
  content text not null,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.voice_config enable row level security;
alter table public.buckets enable row level security;
alter table public.sources enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.drafts enable row level security;
alter table public.draft_versions enable row level security;

-- Profiles: users can read all profiles, update their own
create policy "Profiles are viewable by all authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Voice config: all authenticated users can read and update
create policy "Voice config is viewable by all authenticated users"
  on public.voice_config for select to authenticated using (true);
create policy "Voice config is editable by all authenticated users"
  on public.voice_config for update to authenticated using (true);

-- Buckets: all authenticated can read, owners can write
create policy "Buckets are viewable by all authenticated users"
  on public.buckets for select to authenticated using (true);
create policy "Users can create buckets"
  on public.buckets for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update their buckets"
  on public.buckets for update to authenticated using (auth.uid() = owner_id);
create policy "Owners can delete their buckets"
  on public.buckets for delete to authenticated using (auth.uid() = owner_id);

-- Sources: all authenticated can read, owners can write
create policy "Sources are viewable by all authenticated users"
  on public.sources for select to authenticated using (true);
create policy "Users can create sources"
  on public.sources for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update their sources"
  on public.sources for update to authenticated using (auth.uid() = owner_id);
create policy "Owners can delete their sources"
  on public.sources for delete to authenticated using (auth.uid() = owner_id);

-- Conversations: all authenticated can read, owners can write
create policy "Conversations are viewable by all authenticated users"
  on public.conversations for select to authenticated using (true);
create policy "Users can create conversations"
  on public.conversations for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update their conversations"
  on public.conversations for update to authenticated using (auth.uid() = owner_id);

-- Messages: all authenticated can read, tied to conversation access
create policy "Messages are viewable by all authenticated users"
  on public.messages for select to authenticated using (true);
create policy "Users can create messages"
  on public.messages for insert to authenticated with check (true);

-- Drafts: all authenticated can read, owners can write
create policy "Drafts are viewable by all authenticated users"
  on public.drafts for select to authenticated using (true);
create policy "Users can create drafts"
  on public.drafts for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update their drafts"
  on public.drafts for update to authenticated using (auth.uid() = owner_id);
create policy "Owners can delete their drafts"
  on public.drafts for delete to authenticated using (auth.uid() = owner_id);

-- Draft versions: all authenticated can read, insert follows draft ownership
create policy "Draft versions are viewable by all authenticated users"
  on public.draft_versions for select to authenticated using (true);
create policy "Users can create draft versions"
  on public.draft_versions for insert to authenticated with check (true);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();
create trigger update_buckets_updated_at before update on public.buckets
  for each row execute procedure public.update_updated_at();
create trigger update_sources_updated_at before update on public.sources
  for each row execute procedure public.update_updated_at();
create trigger update_conversations_updated_at before update on public.conversations
  for each row execute procedure public.update_updated_at();
create trigger update_drafts_updated_at before update on public.drafts
  for each row execute procedure public.update_updated_at();
```

---

## API Route Specifications

### POST /api/chat

The most critical endpoint. Handles conversational Claude interactions with streaming.

**Request body:**
```typescript
{
  conversationId: string;       // UUID of the conversation
  message: string;              // User's message
  mode: 'explore' | 'draft';   // User-selected mode (no auto-detection)
  bucketId?: string;            // Current bucket context
  includeAllBuckets?: boolean;  // Whether to include cross-bucket sources
  platform?: string;            // Target platform for draft generation
}
```

**Server-side flow (Two-Mode Architecture):**
1. Verify auth session
2. Fetch + decrypt user's Anthropic API key
3. Fetch conversation history
4. Read `mode` from request body (`explore` or `draft` — user selects explicitly, no auto-detection)
5. **Route to appropriate mode:**

   **If EXPLORE mode:**
   - Embed the user's message via OpenAI embedding API
   - Query `match_sources()` for top-k semantically relevant sources across all buckets
   - Also include all sources from the current bucket
   - Fetch voice profiles (personal + company)
   - Construct EXPLORE system prompt with retrieved sources injected into context
   - Call Opus with streaming

   **If DRAFT mode:**
   - Fetch full conversation history (this IS the context — no structured brief)
   - Fetch voice profiles (personal + company + platform)
   - Construct DRAFT system prompt (voice + style + platform constraints + conversation context)
   - Call Sonnet with streaming
   - Parse `<draft>` tags, save/update drafts table

6. Stream response back as SSE
7. Save user message + assistant message to DB

**Response:** Server-Sent Events stream. Each event contains a chunk of the assistant's response.

**Streaming implementation:**
```typescript
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  const { conversationId, message, mode, bucketId, includeAllBuckets, platform } = await req.json();

  // ... auth, fetch data ...

  const client = new Anthropic({ apiKey: decryptedApiKey });

  // Select model based on user-selected mode
  const model = mode === 'draft'
    ? userProfile.draft_model || 'claude-sonnet-4-20250514'
    : userProfile.explore_model || 'claude-opus-4-5-20250929';

  const stream = await client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: conversationHistory,
  });

  // Return as a ReadableStream
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
        }
      }

      // Get the full response for saving
      const fullResponse = await stream.finalMessage();
      const assistantContent = fullResponse.content[0].text;

      // Save messages to DB
      // ... save user message and assistant message ...

      // Extract draft if in draft mode
      // ... parse <draft> tags → save/update draft ...

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      controller.close();
    }
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### POST /api/sources

**Create a source:**
```typescript
// Request
{ content: string; sourceType: string; sourceUrl?: string; bucketId?: string; }
// Response
{ source: Source }
```

### GET /api/sources?bucketId=xxx&inbox=true

**List sources.** If `inbox=true`, returns sources where `bucket_id is null` for the current user. If `bucketId` is provided, returns sources for that bucket.

### PATCH /api/sources/[id]

**Update a source** (move to bucket, edit content, etc.)
```typescript
{ bucketId?: string; content?: string; sourceType?: string; }
```

### DELETE /api/sources/[id]

### POST /api/embed

Called automatically when a source is created or updated. Generates an embedding and stores it in the source's `embedding` column.

**Server-side flow:**
1. Receive source ID
2. Fetch source content
3. Call OpenAI `text-embedding-3-small` API
4. Store embedding vector in the source row
5. Return success

Also callable as a batch operation for backfilling existing sources.

### POST /api/buckets

```typescript
{ name: string; description?: string; color?: string; }
```

### GET /api/buckets

Returns all buckets with source count and draft count.

### GET /api/buckets/[id]

Returns bucket with all sources and drafts.

### PATCH /api/buckets/[id]

### DELETE /api/buckets/[id]

### GET /api/drafts?bucketId=xxx&status=draft&platform=linkedin

Filterable draft list.

### PATCH /api/drafts/[id]

Update draft content, status, title. When content changes, auto-create a draft_version record.

### POST /api/settings/api-key

```typescript
{ apiKey: string }
```
Encrypts the key and saves to user profile. Returns `{ success: true }`. Never returns the key.

### GET /api/settings/api-key

Returns `{ hasKey: boolean }` — just whether a key is set, never the actual key.

### PATCH /api/settings/voice-profile

```typescript
{ personalVoiceProfile: string[] }
```

### PATCH /api/settings/voice-config/[id]

Update shared voice config (company or platform).

---

## System Prompt Construction

The system prompt is built dynamically per conversation. This lives in `lib/claude/prompts.ts`. There are two prompt builders, one for each mode:

```typescript
// Two mode-specific prompt builders
export function buildExplorePrompt(params: ExplorePromptInput): string   // Opus - retrieval + synthesis
export function buildDraftPrompt(params: DraftPromptInput): string       // Sonnet - voice + platform + conversation context
```

**Explore prompt** includes: "You are in EXPLORE mode. Help the user find angles, connect ideas, and brainstorm narratives across their source material."

**Draft prompt** includes: "You are in DRAFT mode. Write compelling platform-specific content based on the conversation so far, following voice profile and platform rules."

### buildExplorePrompt (Opus)

```typescript
export function buildExplorePrompt({
  userName,
  personalVoice,
  companyVoice,
  bucketName,
  sources,
  otherBucketSources,
}: ExplorePromptInput): string {
  let prompt = `You are in EXPLORE mode. You are a content strategist for Compound, an AI consulting company. Your job is to help the user find the angle, connect ideas, and brainstorm narrative structures across their source material.

## Your Role
- Help the user find angles, connections, and narratives across their source material.
- Identify contrarian takes, surprising connections, and strong theses.
- Reference specific sources when building arguments (quote or paraphrase them so the user knows what material you're drawing from).
- Distinguish between the user's original thoughts (voice memos, notes) and external material (articles, tweets). Prioritize the user's voice.
- Be direct and collaborative — this is a working session, not a formal interaction.
- Do NOT write full drafts. That happens in Draft mode. You can sketch rough outlines or suggest structures.

## Company Voice
${companyVoice.length > 0 ? companyVoice.map(r => \`- \${r}\`).join('\\n') : 'No company voice rules set yet.'}

## ${userName}'s Personal Voice
${personalVoice.length > 0 ? personalVoice.map(r => \`- \${r}\`).join('\\n') : 'No personal voice rules set yet.'}`;

  prompt += `\n\n## Source Material\nThe following sources are available from the bucket "${bucketName}":\n`;

  for (const source of sources) {
    prompt += `\n---\n[${source.source_type}] (${source.created_at})\n${source.content}`;
    if (source.source_url) prompt += `\nURL: ${source.source_url}`;
    prompt += `\n---`;
  }

  if (otherBucketSources && otherBucketSources.length > 0) {
    prompt += `\n\n## Additional Sources (Other Buckets)\n`;
    for (const source of otherBucketSources) {
      prompt += `\n[Bucket: ${source.bucket_name}] [${source.source_type}]\n${source.content}\n`;
    }
  }

  return prompt;
}
```

### buildDraftPrompt (Sonnet)

```typescript
export function buildDraftPrompt({
  userName,
  personalVoice,
  companyVoice,
  platformVoice,
  platform,
  conversationHistory,
}: DraftPromptInput): string {
  let prompt = `You are in DRAFT mode. Your job is to write compelling platform-specific content based on the Explore conversation below. Follow the voice profile and platform rules strictly.

## Your Role
- Write the draft based on the conversation context provided below.
- Follow the voice profile rules strictly — these define the writing style.
- When producing or updating a draft, always wrap it in <draft> tags (see Draft Format below).
- Be direct and collaborative — explain your choices, ask for feedback.

## Company Voice
${companyVoice.length > 0 ? companyVoice.map(r => \`- \${r}\`).join('\\n') : 'No company voice rules set yet.'}

## ${userName}'s Personal Voice
${personalVoice.length > 0 ? personalVoice.map(r => \`- \${r}\`).join('\\n') : 'No personal voice rules set yet.'}`;

  if (platform && platformVoice) {
    prompt += `\n\n## Platform: ${platform}\n${platformVoice.map(r => \`- \${r}\`).join('\\n')}`;
  }

  prompt += `\n\n## Explore Conversation Context\nThe following is the full conversation from Explore mode. Use this as the basis for your draft:\n\n${conversationHistory}`;

  prompt += `\n\n## Draft Format
When you produce or update a draft, wrap it in these exact delimiters:

<draft platform="[platform]" title="[title]">
[Your draft content in markdown]
</draft>

Always include these delimiters when producing or updating draft content. Continue your conversational response outside the delimiters. You can include commentary before or after the draft tags explaining your choices or asking for feedback.`;

  return prompt;
}
```

---

## Draft Extraction from Claude Responses

When Claude's response contains `<draft>` tags, the client-side parser extracts the draft content and metadata. This lives in `lib/claude/parse.ts`.

```typescript
interface ExtractedDraft {
  platform: string;
  title: string;
  content: string;
}

export function extractDraft(response: string): ExtractedDraft | null {
  const draftRegex = /<draft\s+platform="([^"]+)"\s+title="([^"]+)">\s*([\s\S]*?)\s*<\/draft>/;
  const match = response.match(draftRegex);

  if (!match) return null;

  return {
    platform: match[1],
    title: match[2],
    content: match[3].trim(),
  };
}

export function stripDraftTags(response: string): string {
  return response.replace(/<draft\s+[^>]*>[\s\S]*?<\/draft>/g, '').trim();
}
```

On the client, after each streamed response completes:
1. Run `extractDraft()` on the full response (only relevant in Draft mode)
2. If a draft is found, update the draft panel with the new content
3. Display the conversational portion (with draft stripped) in the chat thread

During streaming, you can detect the opening `<draft` tag and start routing content to the draft panel in real-time.

---

## Semantic Search

Semantic search is powered by pgvector and OpenAI embeddings. The following SQL function lives in the database and is called from the API route handlers.

```sql
-- Semantic search function for finding relevant sources
create or replace function match_sources(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 20
)
returns table (
  id uuid,
  content text,
  source_type text,
  source_url text,
  bucket_id uuid,
  owner_id uuid,
  similarity float
)
language sql stable
as $$
  select
    sources.id,
    sources.content,
    sources.source_type,
    sources.source_url,
    sources.bucket_id,
    sources.owner_id,
    1 - (sources.embedding <=> query_embedding) as similarity
  from sources
  where 1 - (sources.embedding <=> query_embedding) > match_threshold
  order by sources.embedding <=> query_embedding
  limit match_count;
$$;
```

---

## API Key Encryption

Simple AES-256-GCM encryption for storing Anthropic API keys. Lives in `lib/encryption.ts`.

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET = process.env.ENCRYPTION_SECRET!; // 32-byte hex string

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const key = Buffer.from(SECRET, 'hex');
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const key = Buffer.from(SECRET, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

Generate `ENCRYPTION_SECRET` with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Client-Side Streaming Pattern

For consuming the Claude streaming response on the client:

```typescript
async function sendMessage(message: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      message,
      mode,        // 'explore' or 'draft' — user-selected
      bucketId,
      includeAllBuckets,
      platform,
    }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';
  let currentDraftContent = '';
  let inDraftBlock = false;

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        if (data.done) {
          // Stream complete — extract final draft
          const draft = extractDraft(fullResponse);
          if (draft) {
            setCurrentDraft(draft);
          }
          break;
        }

        fullResponse += data.text;
        
        // Real-time draft detection (optional enhancement)
        if (fullResponse.includes('<draft') && !inDraftBlock) {
          inDraftBlock = true;
        }
        if (inDraftBlock) {
          const partialDraft = extractDraft(fullResponse);
          if (partialDraft) {
            setCurrentDraft(partialDraft);
            inDraftBlock = false;
          }
        }

        // Update chat display with non-draft content
        setChatResponse(stripDraftTags(fullResponse));
      }
    }
  }
}
```

---

## Supabase Client Setup

### Browser Client (`lib/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (`lib/supabase/server.ts`)

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

// Service role client for admin operations (API key decryption, etc.)
export function createServiceRoleClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}
```

---

## TypeScript Types (`lib/types.ts`)

```typescript
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
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
  metadata: Record<string, any>;
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

// Input types for API calls
export interface CreateSourceInput {
  content: string;
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
}

// Platform display config
export const PLATFORM_CONFIG: Record<Platform, { label: string; icon: string; desc: string; color: string }> = {
  linkedin: { label: 'LinkedIn', icon: 'in', desc: 'Professional, insight-driven', color: '#0A66C2' },
  twitter: { label: 'Twitter / X', icon: '𝕏', desc: 'Punchy, provocative', color: '#1C1C1C' },
  longform: { label: 'Long-form', icon: '¶', desc: 'Narrative depth, 2-4k words', color: '#8B6914' },
  shortform: { label: 'Short-form', icon: '§', desc: 'Tight argument, 500-1k words', color: '#5B7553' },
};

// Bucket color palette
export const BUCKET_COLORS = [
  '#E8B931', '#4A9EDE', '#D4594E', '#9B59B6',
  '#2ECC71', '#E67E22', '#1ABC9C', '#E74C3C',
  '#3498DB', '#F39C12',
];
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Encryption
ENCRYPTION_SECRET=<64-char-hex-string>

# Optional: Default Anthropic key for development
# ANTHROPIC_API_KEY=sk-ant-...

# Embeddings
OPENAI_API_KEY=sk-...  # for text-embedding-3-small
```

---

## Dependencies

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "@anthropic-ai/sdk": "^0.30",
    "openai": "^4",
    "react-markdown": "^9",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "@types/node": "^20",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```
