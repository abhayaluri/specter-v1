'use client'

import { useState } from 'react'
import { DraftStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface StatusBadgeProps {
  status: DraftStatus
  onStatusChange: (newStatus: DraftStatus) => void
}

const STATUS_CONFIG: Record<DraftStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: '#9CA3AF', bgColor: '#9CA3AF20' },
  ready: { label: 'Ready', color: '#068BD4', bgColor: '#068BD420' },
  published: { label: 'Published', color: '#10B981', bgColor: '#10B98120' },
}

/**
 * Status Badge Component
 *
 * Displays draft status with dropdown to change it.
 * - Draft (gray): work in progress
 * - Ready (cyan): approved, ready to publish
 * - Published (green): published externally
 */
export default function StatusBadge({ status, onStatusChange }: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)

  const config = STATUS_CONFIG[status]

  const handleStatusChange = (newStatus: DraftStatus) => {
    onStatusChange(newStatus)
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer">
          <Badge
            variant="outline"
            style={{
              borderColor: config.color,
              color: config.color,
              backgroundColor: config.bgColor,
            }}
          >
            {config.label} ▼
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(STATUS_CONFIG).map(([key, value]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => handleStatusChange(key as DraftStatus)}
            className={status === key ? 'bg-primary/10' : ''}
          >
            <span
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: value.color }}
            />
            {value.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
