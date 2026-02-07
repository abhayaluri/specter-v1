import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encryption'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('anthropic_api_key_encrypted')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ hasKey: !!profile?.anthropic_api_key_encrypted })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { apiKey } = await request.json()
  if (!apiKey || typeof apiKey !== 'string') {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 })
  }

  // Basic validation: Anthropic keys start with "sk-ant-"
  if (!apiKey.startsWith('sk-ant-')) {
    return NextResponse.json({ error: 'Invalid Anthropic API key format' }, { status: 400 })
  }

  const encrypted = encrypt(apiKey)
  const { error } = await supabase
    .from('profiles')
    .update({ anthropic_api_key_encrypted: encrypted })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('profiles')
    .update({ anthropic_api_key_encrypted: null })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
