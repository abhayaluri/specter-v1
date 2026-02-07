import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Keep returning 501 for now — full implementation in Task 9
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bucketId } = await request.json()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      bucket_id: bucketId || null,
      owner_id: user.id,
      mode: 'explore',
      include_all_buckets: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ conversation: data }, { status: 201 })
}
