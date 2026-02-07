import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bucketId = searchParams.get('bucketId');
  const mode = searchParams.get('mode');

  let query = supabase
    .from('conversations')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false });

  // Optional filters
  if (bucketId) {
    query = query.eq('bucket_id', bucketId);
  }
  if (mode) {
    query = query.eq('mode', mode);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversations: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const {
    bucketId = null,
    mode = 'explore',
    platform = null,
    includeAllBuckets = true,
  } = body;

  // Platform required for Draft mode
  if (mode === 'draft' && !platform) {
    return NextResponse.json({ error: 'Platform required for Draft mode' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      bucket_id: bucketId,
      owner_id: user.id,
      mode,
      platform: platform || null,
      include_all_buckets: includeAllBuckets,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversation: data }, { status: 201 });
}
