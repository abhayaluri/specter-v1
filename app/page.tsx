import AppShell from '@/components/layout/AppShell'

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="font-display text-5xl font-semibold tracking-tighter text-foreground mb-3">
          Specter Content Engine
        </h1>
        <p className="text-muted-foreground text-lg font-light tracking-wide mb-12">
          Invisible Intelligence
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:border-border-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-200">
            <h3 className="text-foreground font-semibold mb-2">Sources</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 6</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:border-border-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-200">
            <h3 className="text-foreground font-semibold mb-2">Buckets</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 7</p>
          </div>
          <div className="p-6 bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.4)] hover:border-border-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-200">
            <h3 className="text-foreground font-semibold mb-2">Drafts</h3>
            <p className="text-muted-foreground text-sm">Coming in Task 11</p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
