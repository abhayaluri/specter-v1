import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all buckets (workspace-wide visibility) with source and draft counts
  const { data: buckets, error } = await supabase
    .from('buckets')
    .select(`
      *,
      sources(count),
      drafts(count)
    `)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten counts from Supabase's nested aggregation
  const formatted = (buckets ?? []).map((b: any) => ({
    ...b,
    source_count: b.sources?.[0]?.count ?? 0,
    draft_count: b.drafts?.[0]?.count ?? 0,
    sources: undefined,
    drafts: undefined,
  }))

  return NextResponse.json({ buckets: formatted })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, color } = await request.json()

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 })
  }

  // Auto-assign color from palette if not provided
  const { data: existing } = await supabase
    .from('buckets')
    .select('color')

  const usedColors = (existing ?? []).map((b: any) => b.color)
  const BUCKET_COLORS = [
    '#E8B931', '#4A9EDE', '#D4594E', '#9B59B6',
    '#2ECC71', '#E67E22', '#1ABC9C', '#E74C3C',
    '#3498DB', '#F39C12',
  ]
  const availableColor = BUCKET_COLORS.find((c) => !usedColors.includes(c)) || BUCKET_COLORS[0]

  // Determine next sort_order
  const { data: maxSort } = await supabase
    .from('buckets')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextSort = ((maxSort?.[0]?.sort_order ?? -1) + 1)

  const { data, error } = await supabase
    .from('buckets')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      color: color || availableColor,
      owner_id: user.id,
      sort_order: nextSort,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bucket: data }, { status: 201 })
}
