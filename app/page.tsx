import AppShell from '@/components/layout/AppShell'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="font-display text-[32px] tracking-tight text-foreground mb-6">
          Specter Content Engine
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Invisible Intelligence
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-foreground font-medium mb-2">Sources</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 6</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-foreground font-medium mb-2">Buckets</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 7</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-foreground font-medium mb-2">Drafts</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 11</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
