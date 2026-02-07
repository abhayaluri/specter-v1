# Supabase Setup Guide — Cambrian Content Engine V1

Follow this guide to create the Supabase project, run the full database migration, configure auth, and verify everything works. Should take 15-20 minutes.

---

## 1. Create the Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **"New Project"**
3. Fill in:
   - **Organization:** Create or select one (e.g., "Cambrian")
   - **Project name:** `cambrian-content-engine`
   - **Database password:** Click "Generate a password" and **save it somewhere safe** (you won't need it often, but you can't recover it)
   - **Region:** `us-east-1` (closest to Atlanta)
   - **Plan:** Free tier is fine for V1
4. Click **"Create new project"** and wait ~2 minutes for provisioning

---

## 2. Get Your Project Credentials

Once the project is ready, grab these four values:

### Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
- Go to **Settings → API → Project URL**
- Looks like: `https://xxxxx.supabase.co`

### Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Go to **Settings → API → Project API Keys → `anon` `public`**
- This is safe to expose to the client — RLS protects your data

### Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
- Go to **Settings → API → Project API Keys → `service_role` `secret`**
- **NEVER expose this to the client.** Server-side only.

### Generate Encryption Secret (`ENCRYPTION_SECRET`)

Run this in your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the 64-character hex string output.

### `.env.local` Template

Create a `.env.local` file in the project root with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Encryption (for API key storage)
ENCRYPTION_SECRET=<paste-64-char-hex-string-here>

# Embeddings (needed for semantic search)
OPENAI_API_KEY=sk-...
```

---

## 3. Enable pgvector Extension

Before running the migration, verify pgvector is available.

1. Go to **SQL Editor** in the Supabase dashboard
2. Click **"New query"**
3. Run:

```sql
create extension if not exists vector;
```

4. Verify it worked:

```sql
select * from pg_extension where extname = 'vector';
```

Should return one row. If it doesn't, your Supabase plan may not support pgvector (free tier does).

> **Note:** The main migration script also includes this `create extension` statement, but it's good to verify it independently first since pgvector availability can vary.

---

## 4. Run the Full SQL Migration

This single script creates all tables, RLS policies, triggers, functions, and seed data.

1. Go to **SQL Editor** in the Supabase dashboard
2. Click **"New query"**
3. Paste the entire script below
4. Click **"Run"** (or Cmd+Enter)
5. Should see "Success. No rows returned." for each statement

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

-- Embedding index for semantic search
-- Intentionally commented out: exact search is fast enough at V1 scale
-- (2 users, thousands of sources). Add this index when source count exceeds ~1000.
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

## 5. Create the `match_sources()` Function

This is the semantic search function used by the Explore mode to find relevant sources. Run it as a separate query after the main migration.

1. Go to **SQL Editor**
2. Click **"New query"**
3. Paste and run:

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

## 6. Configure Authentication

1. Go to **Authentication → Providers** in the Supabase dashboard
2. Ensure the **Email** provider is enabled (it should be by default)
3. **Disable email confirmations** for V1:
   - Go to **Authentication → Settings** (or **Settings → Auth**)
   - Toggle off **"Enable email confirmations"**
   - This avoids needing email verification — fine for a 2-person team
4. **Create the two user accounts:**
   - Go to **Authentication → Users → "Add user" → "Create new user"**
   - **User 1:** Abhay's email + password
   - **User 2:** Srikar's email + password
5. Verify both users appear in the Users list
6. Go to **Table Editor → profiles** and verify two rows were auto-created (the `handle_new_user` trigger should have fired)

---

## 7. Verify the Setup

Run these queries in the SQL Editor to confirm everything is working:

```sql
-- 1. Check all tables exist
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
-- Expected: buckets, conversations, draft_versions, drafts, messages, profiles, sources, voice_config
```

```sql
-- 2. Check pgvector is working
select * from pg_extension where extname = 'vector';
-- Should return one row
```

```sql
-- 3. Check profiles were auto-created for both users
select id, display_name, explore_model, draft_model from profiles;
-- Should see 2 rows (one per user)
```

```sql
-- 4. Check voice config seed data
select type, platform, rules from voice_config order by type, platform;
-- Should see 5 rows: 1 company + 4 platforms (linkedin, longform, shortform, twitter)
```

```sql
-- 5. Check RLS is enabled on all tables
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in (
  'profiles', 'sources', 'buckets', 'conversations',
  'messages', 'drafts', 'draft_versions', 'voice_config'
);
-- All 8 rows should show rowsecurity = true
```

```sql
-- 6. Check match_sources function exists
select routine_name from information_schema.routines
where routine_schema = 'public' and routine_name = 'match_sources';
-- Should return one row
```

```sql
-- 7. Check conversations table has correct columns
select column_name, data_type, column_default from information_schema.columns
where table_name = 'conversations' and table_schema = 'public'
order by ordinal_position;
-- Should include: mode (default 'explore'), include_all_buckets (default true)
-- Should NOT include: conversation_mode, current_brief, retrieved_source_ids
```

If all 7 checks pass, your database is ready.

---

## 8. Troubleshooting

### "permission denied for schema public"
You're not running SQL as the `postgres` role. The Supabase SQL Editor uses this role by default — make sure you're using the SQL Editor, not an external client with a different role.

### "type vector does not exist"
The pgvector extension isn't enabled. Run `create extension if not exists vector;` first (see Section 3).

### Profile not auto-created after user signup
Check that the `on_auth_user_created` trigger exists:
```sql
select * from information_schema.triggers where trigger_name = 'on_auth_user_created';
```
If it's missing, re-run the `handle_new_user()` function and trigger creation from the migration script.

### "relation already exists"
You've already run the migration. If you need to start fresh, drop all tables in reverse dependency order:
```sql
drop table if exists public.draft_versions cascade;
drop table if exists public.drafts cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.sources cascade;
drop table if exists public.buckets cascade;
drop table if exists public.voice_config cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user();
drop function if exists public.update_updated_at();
drop function if exists public.match_sources(vector, float, int);
```
Then re-run the migration.

### RLS blocking all reads
You need to be authenticated. The anon key without a session won't pass `to authenticated` policies. Make sure your app is creating a proper auth session before querying tables.
