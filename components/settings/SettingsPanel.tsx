'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

const AVAILABLE_MODELS = [
  { value: 'claude-opus-4-5-20250929', label: 'Claude Opus 4.5 (Best quality)' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Fast & capable)' },
]

interface VoiceConfig {
  id: string
  type: 'company' | 'platform'
  platform: string | null
  rules: string[]
}

export default function SettingsPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // API Key state
  const [hasKey, setHasKey] = useState(false)
  const [apiKey, setApiKey] = useState('')

  // Voice profile state
  const [personalRules, setPersonalRules] = useState<string[]>([])
  const [voiceConfigs, setVoiceConfigs] = useState<VoiceConfig[]>([])

  // Model state
  const [exploreModel, setExploreModel] = useState('claude-opus-4-5-20250929')
  const [draftModel, setDraftModel] = useState('claude-sonnet-4-20250514')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Load API key status
      const apiKeyRes = await fetch('/api/settings/api-key')
      const apiKeyData = await apiKeyRes.json()
      setHasKey(apiKeyData.hasKey)

      // Load personal voice profile
      const voiceRes = await fetch('/api/settings/voice-profile')
      const voiceData = await voiceRes.json()
      setPersonalRules(voiceData.rules || [])

      // Load voice configs (company + platforms)
      const { data: configs } = await supabase
        .from('voice_config')
        .select('*')
        .order('type')
      setVoiceConfigs(configs || [])

      // Load model settings
      const modelsRes = await fetch('/api/settings/models')
      const modelsData = await modelsRes.json()
      setExploreModel(modelsData.exploreModel || 'claude-opus-4-5-20250929')
      setDraftModel(modelsData.draftModel || 'claude-sonnet-4-20250514')
    } catch (err) {
      showStatus('error', 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  function showStatus(type: 'success' | 'error', message: string) {
    setStatus({ type, message })
    setTimeout(() => setStatus(null), 3000)
  }

  async function saveApiKey() {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      })
      const data = await res.json()
      if (res.ok) {
        setHasKey(true)
        setApiKey('')
        showStatus('success', 'API key saved successfully')
      } else {
        showStatus('error', data.error || 'Failed to save API key')
      }
    } catch (err) {
      showStatus('error', 'Failed to save API key')
    } finally {
      setSaving(false)
    }
  }

  async function removeApiKey() {
    if (!confirm('Remove API key? You will need to re-enter it to use AI features.')) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/api-key', { method: 'DELETE' })
      if (res.ok) {
        setHasKey(false)
        showStatus('success', 'API key removed')
      } else {
        showStatus('error', 'Failed to remove API key')
      }
    } catch (err) {
      showStatus('error', 'Failed to remove API key')
    } finally {
      setSaving(false)
    }
  }

  async function savePersonalVoice() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/voice-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: personalRules.filter(r => r.trim()) }),
      })
      if (res.ok) {
        showStatus('success', 'Personal voice profile saved')
      } else {
        showStatus('error', 'Failed to save voice profile')
      }
    } catch (err) {
      showStatus('error', 'Failed to save voice profile')
    } finally {
      setSaving(false)
    }
  }

  async function saveVoiceConfig(configId: string, rules: string[]) {
    setSaving(true)
    try {
      const res = await fetch(`/api/settings/voice-config/${configId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: rules.filter(r => r.trim()) }),
      })
      if (res.ok) {
        showStatus('success', 'Voice profile saved')
      } else {
        showStatus('error', 'Failed to save voice profile')
      }
    } catch (err) {
      showStatus('error', 'Failed to save voice profile')
    } finally {
      setSaving(false)
    }
  }

  async function saveModels() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exploreModel, draftModel }),
      })
      if (res.ok) {
        showStatus('success', 'Model preferences saved')
      } else {
        showStatus('error', 'Failed to save model preferences')
      }
    } catch (err) {
      showStatus('error', 'Failed to save model preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading settings...</div>
  }

  const companyConfig = voiceConfigs.find(c => c.type === 'company')
  const linkedinConfig = voiceConfigs.find(c => c.platform === 'linkedin')
  const twitterConfig = voiceConfigs.find(c => c.platform === 'twitter')
  const longformConfig = voiceConfigs.find(c => c.platform === 'longform')
  const shortformConfig = voiceConfigs.find(c => c.platform === 'shortform')

  return (
    <div className="space-y-6">
      {status && (
        <div className={`p-3 rounded-lg ${status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {status.message}
        </div>
      )}

      <Tabs defaultValue="api-key" className="w-full">
        <TabsList>
          <TabsTrigger value="api-key">API Key</TabsTrigger>
          <TabsTrigger value="voice">Voice Profiles</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        <TabsContent value="api-key" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anthropic API Key</CardTitle>
              <CardDescription>
                Your API key is encrypted and never exposed. Required for AI features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {hasKey ? (
                  <span className="text-sm text-green-500 font-medium">● Connected</span>
                ) : (
                  <span className="text-sm text-muted-foreground font-medium">○ Not set</span>
                )}
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{' '}
                  <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    console.anthropic.com
                  </a>
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveApiKey} disabled={saving || !apiKey.trim()}>
                  {saving ? 'Saving...' : 'Save Key'}
                </Button>
                {hasKey && (
                  <Button variant="destructive" onClick={removeApiKey} disabled={saving}>
                    Remove Key
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList>
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
              <TabsTrigger value="longform">Long-form</TabsTrigger>
              <TabsTrigger value="shortform">Short-form</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <VoiceRulesEditor
                title="Personal Voice Profile"
                description="Your unique writing style and perspective"
                rules={personalRules}
                onChange={setPersonalRules}
                onSave={savePersonalVoice}
                saving={saving}
              />
            </TabsContent>

            <TabsContent value="company">
              {companyConfig && (
                <VoiceRulesEditor
                  title="Company Voice (Compound)"
                  description="Shared voice for the company brand"
                  rules={companyConfig.rules}
                  onChange={(rules) => {
                    setVoiceConfigs(prev => prev.map(c => c.id === companyConfig.id ? { ...c, rules } : c))
                  }}
                  onSave={() => saveVoiceConfig(companyConfig.id, companyConfig.rules)}
                  saving={saving}
                />
              )}
            </TabsContent>

            <TabsContent value="linkedin">
              {linkedinConfig && (
                <VoiceRulesEditor
                  title="LinkedIn Voice"
                  description="Professional, insight-driven posts"
                  rules={linkedinConfig.rules}
                  onChange={(rules) => {
                    setVoiceConfigs(prev => prev.map(c => c.id === linkedinConfig.id ? { ...c, rules } : c))
                  }}
                  onSave={() => saveVoiceConfig(linkedinConfig.id, linkedinConfig.rules)}
                  saving={saving}
                />
              )}
            </TabsContent>

            <TabsContent value="twitter">
              {twitterConfig && (
                <VoiceRulesEditor
                  title="Twitter/X Voice"
                  description="Punchy, provocative threads"
                  rules={twitterConfig.rules}
                  onChange={(rules) => {
                    setVoiceConfigs(prev => prev.map(c => c.id === twitterConfig.id ? { ...c, rules } : c))
                  }}
                  onSave={() => saveVoiceConfig(twitterConfig.id, twitterConfig.rules)}
                  saving={saving}
                />
              )}
            </TabsContent>

            <TabsContent value="longform">
              {longformConfig && (
                <VoiceRulesEditor
                  title="Long-form Voice"
                  description="Narrative depth, 2-4k words"
                  rules={longformConfig.rules}
                  onChange={(rules) => {
                    setVoiceConfigs(prev => prev.map(c => c.id === longformConfig.id ? { ...c, rules } : c))
                  }}
                  onSave={() => saveVoiceConfig(longformConfig.id, longformConfig.rules)}
                  saving={saving}
                />
              )}
            </TabsContent>

            <TabsContent value="shortform">
              {shortformConfig && (
                <VoiceRulesEditor
                  title="Short-form Voice"
                  description="Tight argument, 500-1k words"
                  rules={shortformConfig.rules}
                  onChange={(rules) => {
                    setVoiceConfigs(prev => prev.map(c => c.id === shortformConfig.id ? { ...c, rules } : c))
                  }}
                  onSave={() => saveVoiceConfig(shortformConfig.id, shortformConfig.rules)}
                  saving={saving}
                />
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Selection</CardTitle>
              <CardDescription>
                Choose which Claude models to use for Explore and Draft modes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="explore-model">Explore Model</Label>
                <Select value={exploreModel} onValueChange={setExploreModel}>
                  <SelectTrigger id="explore-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for semantic search and synthesis
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="draft-model">Draft Model</Label>
                <Select value={draftModel} onValueChange={setDraftModel}>
                  <SelectTrigger id="draft-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for writing drafts
                </p>
              </div>

              <Button onClick={saveModels} disabled={saving}>
                {saving ? 'Saving...' : 'Save Model Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface VoiceRulesEditorProps {
  title: string
  description: string
  rules: string[]
  onChange: (rules: string[]) => void
  onSave: () => void
  saving: boolean
}

function VoiceRulesEditor({ title, description, rules, onChange, onSave, saving }: VoiceRulesEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rules yet. Add your first rule below.</p>
          ) : (
            rules.map((rule, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={rule}
                  onChange={(e) => {
                    const newRules = [...rules]
                    newRules[index] = e.target.value
                    onChange(newRules)
                  }}
                  placeholder="Voice rule..."
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onChange(rules.filter((_, i) => i !== index))}
                >
                  ✕
                </Button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onChange([...rules, ''])}
          >
            Add Rule
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
