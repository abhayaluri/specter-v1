import AppShell from '@/components/layout/AppShell'
import SettingsPanel from '@/components/settings/SettingsPanel'

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <h1 className="font-display text-[32px] tracking-tight text-foreground mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground mb-8">
          Configure your AI models, API key, and voice profiles.
        </p>
        <SettingsPanel />
      </div>
    </AppShell>
  )
}
