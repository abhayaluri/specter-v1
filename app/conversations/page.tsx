import AppShell from '@/components/layout/AppShell'
import ConversationListView from '@/components/conversations/ConversationListView'

export default function ConversationsPage() {
  return (
    <AppShell>
      <ConversationListView />
    </AppShell>
  )
}
