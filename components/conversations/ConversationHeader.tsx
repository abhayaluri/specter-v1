'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Conversation, ConversationMode, Platform, PLATFORM_CONFIG } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface ConversationHeaderProps {
  conversation: Conversation
  onModeChange: (mode: ConversationMode, platform?: Platform) => void
  onVoiceChange: (voiceMode: 'personal' | 'compound') => void
  onPlatformChange: (platform: Platform) => void
  onTitleChange: (title: string) => void
  currentVoiceMode: 'personal' | 'compound'
}

/**
 * Conversation Header Component
 *
 * Top bar with:
 * - Back link to bucket or conversations list
 * - Editable title
 * - Mode toggle (Explore/Draft)
 * - Voice selector (Personal/Compound)
 * - Platform selector (Draft mode only)
 */
export default function ConversationHeader({
  conversation,
  onModeChange,
  onVoiceChange,
  onPlatformChange,
  onTitleChange,
  currentVoiceMode,
}: ConversationHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(conversation.title || '')
  const [showPlatformModal, setShowPlatformModal] = useState(false)
  const [selectedPlatformForSwitch, setSelectedPlatformForSwitch] = useState<Platform | null>(null)

  const handleTitleSave = () => {
    const trimmed = editedTitle.trim()
    if (trimmed && trimmed !== conversation.title) {
      onTitleChange(trimmed)
    }
    setIsEditingTitle(false)
  }

  const handleModeChange = (newMode: ConversationMode) => {
    if (newMode === conversation.mode) return

    // Switching to Draft mode requires platform selection
    if (newMode === 'draft' && !conversation.platform) {
      setShowPlatformModal(true)
    } else {
      onModeChange(newMode, conversation.platform || undefined)
    }
  }

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatformForSwitch(platform)
  }

  const handleConfirmPlatformSwitch = () => {
    if (selectedPlatformForSwitch) {
      onModeChange('draft', selectedPlatformForSwitch)
      setShowPlatformModal(false)
      setSelectedPlatformForSwitch(null)
    }
  }

  const backHref = conversation.bucket_id ? `/buckets/${conversation.bucket_id}` : '/conversations'
  const backLabel = conversation.bucket_id ? 'Back to Bucket' : 'Conversations'

  return (
    <>
      <div className="border-b border-border bg-background p-4">
        <div className="flex items-center gap-4 mb-3">
          {/* Back Link */}
          <Link
            href={backHref}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← {backLabel}
          </Link>

          {/* Title (editable) */}
          <div className="flex-1">
            {isEditingTitle ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave()
                  if (e.key === 'Escape') {
                    setEditedTitle(conversation.title || '')
                    setIsEditingTitle(false)
                  }
                }}
                autoFocus
                className="h-8 text-sm"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-medium cursor-pointer hover:text-primary transition-colors"
              >
                {conversation.title || 'Untitled Conversation'}
              </h2>
            )}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <Button
              variant={conversation.mode === 'explore' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('explore')}
              className="h-7 text-xs"
            >
              🔍 Explore
            </Button>
            <Button
              variant={conversation.mode === 'draft' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleModeChange('draft')}
              className="h-7 text-xs"
            >
              ✍️ Draft
            </Button>
          </div>

          {/* Voice Selector */}
          <Select value={currentVoiceMode} onValueChange={onVoiceChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Voice</SelectItem>
              <SelectItem value="compound">Compound Voice</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Selector (Draft mode only) */}
          {conversation.mode === 'draft' && conversation.platform && (
            <Select value={conversation.platform} onValueChange={onPlatformChange}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Include All Buckets Badge */}
          {conversation.include_all_buckets && (
            <Badge variant="outline" className="text-xs">
              All Sources
            </Badge>
          )}
        </div>
      </div>

      {/* Platform Selection Modal (for Explore → Draft switch) */}
      <Dialog open={showPlatformModal} onOpenChange={setShowPlatformModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Platform for Draft Mode</DialogTitle>
            <DialogDescription>
              Choose which platform you want to write for. This affects format, length, and style.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handlePlatformSelect(key as Platform)}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:border-primary ${
                  selectedPlatformForSwitch === key
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
              >
                <div className="text-2xl mb-2">{config.icon}</div>
                <div className="font-medium text-sm mb-1">{config.label}</div>
                <div className="text-xs text-muted-foreground">{config.desc}</div>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPlatformModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPlatformSwitch}
              disabled={!selectedPlatformForSwitch}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Switch to Draft Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
