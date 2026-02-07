import AppShell from '@/components/layout/AppShell'

export default function ConversationsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="mb-2">Conversations</h1>
        <p className="text-muted-foreground">
          Start a conversation from any bucket to begin exploring and drafting.
        </p>
      </div>
    </AppShell>
  )
}
