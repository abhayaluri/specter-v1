import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Conversation, Message } from '@/lib/types'
import ChatInterface from '@/components/conversations/ChatInterface'

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch conversation and messages
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (convError || !conversation) {
    redirect('/conversations')
  }

  // Fetch messages
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('Failed to fetch messages:', messagesError)
  }

  return (
    <ChatInterface
      conversation={conversation as Conversation}
      initialMessages={(messages || []) as Message[]}
    />
  )
}
