import { DraftVersion } from '@/lib/types'
import { relativeTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'

interface VersionListProps {
  versions: DraftVersion[]
  currentVersion: number
  onVersionSelect: (version: DraftVersion) => void
}

/**
 * Version List Component
 *
 * Shows version history with timestamps.
 * - Current version highlighted
 * - Click to view a previous version (read-only)
 * - Latest version is always the active/editable one
 */
export default function VersionList({
  versions,
  currentVersion,
  onVersionSelect,
}: VersionListProps) {
  if (versions.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No version history yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="px-4 pt-4">
        <h4 className="text-sm font-medium text-foreground mb-2">Version History</h4>
        <p className="text-xs text-muted-foreground mb-3">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-1 px-2">
        {versions.map((version) => {
          const isCurrent = version.version === currentVersion

          return (
            <button
              key={version.id}
              onClick={() => onVersionSelect(version)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-primary/10 border border-primary'
                  : 'hover:bg-card border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  v{version.version}
                </span>
                {isCurrent && (
                  <Badge variant="default" className="text-xs">
                    Current
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {relativeTime(version.created_at)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
