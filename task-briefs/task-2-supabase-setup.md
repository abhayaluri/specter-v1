# Task 2 — Supabase Database Setup Guide

**Status:** COMPLETE
**Dependencies:** None
**Agent type:** Documentation
**Estimated effort:** 1 agent session

---

## Objective

Produce a step-by-step `supabase-setup-guide.md` that Abhay can follow to create the Supabase project, run the full SQL migration, configure auth, and verify everything works. This guide must be clear enough that someone with basic Supabase familiarity can complete it in 15-20 minutes.

This is a **documentation task, not a coding task.** You are writing a setup guide, not building application code.

---

## Before You Start

Read this file:

1. `technical-architecture-and-database-schema.md` — The full SQL migration, RLS policies, and `match_sources()` function are all here. **This is your primary reference.**

You don't need to read the PRD or CLAUDE.md for this task — the architecture doc has everything.

---

## What to Include

### Section 1: Create the Supabase Project

Step-by-step with screenshots guidance (describe what they'll see, not actual images):

1. Go to [supabase.com](https://supabase.com) and sign in / create account
2. Click "New Project"
3. Settings:
   - **Organization:** Create or select one (e.g., "Cambrian")
   - **Project name:** `cambrian-content-engine`
   - **Database password:** Generate a strong one and save it somewhere safe
   - **Region:** Choose closest to Atlanta (e.g., `us-east-1`)
   - **Plan:** Free tier is fine for V1
4. Wait for project to provision (~2 minutes)

### Section 2: Get Your Project Credentials

Once the project is created, document where to find:

1. **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - Settings → API → Project URL
   - Looks like: `https://xxxxx.supabase.co`

2. **Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Settings → API → Project API Keys → `anon` `public`
   - This is safe to expose to the client (RLS protects data)

3. **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`)
   - Settings → API → Project API Keys → `service_role` `secret`
   - **NEVER expose this to the client.** Server-side only.

4. **Generate `ENCRYPTION_SECRET`**
   - Run this in terminal:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Save the output — this is your `ENCRYPTION_SECRET` env var

Document the full `.env.local` template:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Encryption (for API key storage)
ENCRYPTION_SECRET=<paste-64-char-hex-string-here>

# Embeddings (needed for Task 2.5)
OPENAI_API_KEY=sk-...
```

### Section 3: Enable pgvector Extension

Before running the migration, pgvector must be enabled:

1. Go to SQL Editor in the Supabase dashboard
2. Run:
   ```sql
   create extension if not exists vector;
   ```
3. Verify it worked:
   ```sql
   select * from pg_extension where extname = 'vector';
   ```
   Should return one row.

**Note:** The main migration script also includes this `create extension` statement, but it's good to verify it independently first since pgvector availability varies by Supabase plan.

### Section 4: Run the Full SQL Migration

This is the single SQL script that creates all tables, RLS policies, triggers, functions, and seed data.

**Copy the complete SQL migration from the architecture doc** (`technical-architecture-and-database-schema.md`, "Full SQL Migration" section). Include it in full in the guide — do not just reference the other doc. The builder agent reading this guide should not need to look elsewhere.

The migration includes:
- `profiles` table (with `explore_model`, `draft_model` fields)
- `voice_config` table (with seed data for company + platform voices)
- `buckets` table
- `sources` table (with `embedding vector(1536)` column)
- `conversations` table (with `mode` and `include_all_buckets default true`)
- `messages` table (with `draft_content` column)
- `drafts` table
- `draft_versions` table
- All RLS policies (workspace-wide reads, owner-only writes)
- `updated_at` trigger function and triggers
- `handle_new_user()` trigger (auto-creates profile on signup)
- Message index (`idx_messages_conversation`)

**Instructions:**
1. Go to SQL Editor in the Supabase dashboard
2. Click "New query"
3. Paste the entire migration script
4. Click "Run" (or Cmd+Enter)
5. Should see "Success. No rows returned." for each statement

### Section 5: Create the `match_sources()` Function

This is a separate step because it's a custom Postgres function for semantic search.

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

Run this in the SQL Editor after the main migration.

### Section 6: Configure Authentication

1. Go to Authentication → Providers in the Supabase dashboard
2. Ensure **Email** provider is enabled (it should be by default)
3. **Disable** "Confirm email" for V1 (Settings → Auth → toggle off "Enable email confirmations") — this avoids needing email verification for your 2-person team
4. Create the two user accounts:
   - Go to Authentication → Users → "Add user" → "Create new user"
   - **User 1:** Abhay's email + password
   - **User 2:** Srikar's email + password
5. Verify both users appear in the Users list
6. Verify that the `profiles` table has auto-created rows for both users (the `handle_new_user` trigger should have fired)

### Section 7: Verify the Setup

Run these verification queries in the SQL Editor:

```sql
-- 1. Check all tables exist
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
-- Should see: buckets, draft_versions, drafts, messages, profiles, sources, voice_config

-- 2. Check pgvector is working
select * from pg_extension where extname = 'vector';
-- Should return one row

-- 3. Check profiles were auto-created for both users
select id, display_name, explore_model, draft_model from profiles;
-- Should see 2 rows (one per user)

-- 4. Check voice config seed data
select type, platform, rules from voice_config order by type, platform;
-- Should see 5 rows: 1 company + 4 platforms

-- 5. Check RLS is enabled
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('profiles', 'sources', 'buckets', 'conversations', 'messages', 'drafts', 'draft_versions', 'voice_config');
-- All should show rowsecurity = true

-- 6. Check match_sources function exists
select routine_name from information_schema.routines
where routine_schema = 'public' and routine_name = 'match_sources';
-- Should return one row

-- 7. Check conversations table has correct columns
select column_name, data_type, column_default from information_schema.columns
where table_name = 'conversations' and table_schema = 'public'
order by ordinal_position;
-- Should include: mode (default 'explore'), include_all_buckets (default true)
-- Should NOT include: conversation_mode, current_brief, retrieved_source_ids
```

### Section 8: Troubleshooting

Cover common issues:

1. **"permission denied for schema public"** — Make sure you're running SQL as the `postgres` role (default in the SQL Editor)
2. **"type vector does not exist"** — pgvector extension not enabled. Run `create extension if not exists vector;` first
3. **Profile not auto-created after user signup** — Check that the `on_auth_user_created` trigger exists: `select * from information_schema.triggers where trigger_name = 'on_auth_user_created';`
4. **"relation already exists"** — You've already run the migration. If you need to re-run, drop tables first (in reverse dependency order) or use `create table if not exists`
5. **RLS blocking all reads** — Check that you're authenticated. The anon key without a session won't pass `to authenticated` policies.

---

## Output

Create a single file: `supabase-setup-guide.md` in the project root (`/Users/abhay-ryze/Desktop/Cambrian/Cambrian Content Engine V1/supabase-setup-guide.md`).

---

## Acceptance Criteria

- [ ] Complete step-by-step instructions from project creation to verification
- [ ] Full SQL migration script included inline (not just referenced)
- [ ] `match_sources()` function included
- [ ] pgvector extension setup documented
- [ ] Auth configuration: email provider, disable email confirmation, create 2 users
- [ ] All env vars documented with where to find them in the Supabase dashboard
- [ ] `ENCRYPTION_SECRET` generation command included
- [ ] Verification queries that check every table, function, RLS policy, and seed data
- [ ] Troubleshooting section for common issues
- [ ] `.env.local` template included
- [ ] No references to old schema columns (`conversation_mode`, `current_brief`, `retrieved_source_ids`, `synthesis_model`, `drafting_model`)

---

## Reference Files

| File | What to look at |
|------|----------------|
| `technical-architecture-and-database-schema.md` | "Full SQL Migration" section (lines 38-290), "Semantic Search" section (`match_sources()` function) |

---

## Notes for the Agent

- **Copy the full SQL migration into the guide.** Do not reference the architecture doc — the guide should be self-contained. A person following this guide should never need to open another file.
- The migration script in the architecture doc is the authoritative version. If you notice any discrepancies with the PRD's data model, trust the architecture doc.
- The `match_sources()` function is in a separate section of the architecture doc (under "Semantic Search"). Include it in the guide as a separate step after the main migration.
- Keep the language simple and direct. This is for Abhay who knows his way around Supabase but benefits from a checklist he can follow quickly.
- The ivfflat index is intentionally commented out in the migration. Document why: "Exact search is fast enough at V1 scale (2 users, thousands of sources). Add this index when source count exceeds ~1000."
