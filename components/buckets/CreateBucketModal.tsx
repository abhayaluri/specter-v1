'use client'

import { useState, useEffect } from 'react'
import { BUCKET_COLORS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface CreateBucketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  existingBuckets?: any[]
}

export default function CreateBucketModal({
  open,
  onOpenChange,
  onCreated,
  existingBuckets = [],
}: CreateBucketModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-select first unused color
  useEffect(() => {
    if (open) {
      const usedColors = existingBuckets.map((b) => b.color)
      const availableColor = BUCKET_COLORS.find((c) => !usedColors.includes(c)) || BUCKET_COLORS[0]
      setSelectedColor(availableColor)
    }
  }, [open, existingBuckets])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/buckets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
        }),
      })

      if (!res.ok) throw new Error('Failed to create bucket')

      // Reset form
      setName('')
      setDescription('')
      onCreated()
      onOpenChange(false)
    } catch (err) {
      console.error('Create bucket failed:', err)
      alert('Failed to create bucket')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-popover">
        <DialogHeader>
          <DialogTitle>Create Bucket</DialogTitle>
          <DialogDescription>
            Organize your sources into thematic buckets
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AI Developments"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What kind of content goes here?"
              rows={3}
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {BUCKET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                    selectedColor === color
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-popover'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Creating...' : 'Create Bucket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
