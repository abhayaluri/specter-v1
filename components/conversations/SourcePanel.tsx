import { RetrievedSource } from '@/lib/claude/prompts'
import { Badge } from '@/components/ui/badge'

interface SourcePanelProps {
  sources: RetrievedSource[]
}

/**
 * Source Panel Component
 *
 * Right pane for Explore mode.
 * Shows retrieved sources grouped by retrieval method:
 * - Pinned: user-selected sources
 * - Bucket: from current bucket
 * - Semantic: cross-bucket semantic search matches
 */
export default function SourcePanel({ sources }: SourcePanelProps) {
  // Group sources by retrieval method
  const pinnedSources = sources.filter((s) => s.retrieval_method === 'pinned')
  const bucketSources = sources.filter((s) => s.retrieval_method === 'bucket')
  const semanticSources = sources.filter((s) => s.retrieval_method === 'semantic')

  if (sources.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-4xl mb-4">📚</div>
          <h3 className="font-medium text-foreground mb-2">No sources yet</h3>
          <p className="text-sm text-muted-foreground">
            Send a message to see relevant sources
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Sources in Context ({sources.length})
        </h3>
      </div>

      {/* Pinned Sources */}
      {pinnedSources.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Pinned ({pinnedSources.length})
          </h4>
          <div className="space-y-2">
            {pinnedSources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </div>
      )}

      {/* Bucket Sources */}
      {bucketSources.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Bucket ({bucketSources.length})
          </h4>
          <div className="space-y-2">
            {bucketSources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </div>
      )}

      {/* Semantic Matches */}
      {semanticSources.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Semantic Matches ({semanticSources.length})
          </h4>
          <div className="space-y-2">
            {semanticSources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Individual Source Card
 */
function SourceCard({ source }: { source: RetrievedSource }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-sm">
      {/* Header: Type badge + bucket name (if cross-bucket) */}
      <div className="flex items-start gap-2 mb-2">
        <Badge variant="secondary" className="text-xs">
          {source.source_type}
        </Badge>
        {source.bucket_name && (
          <Badge variant="outline" className="text-xs">
            {source.bucket_name}
          </Badge>
        )}
        {source.similarity !== undefined && (
          <Badge variant="outline" className="text-xs ml-auto">
            {Math.round(source.similarity * 100)}% match
          </Badge>
        )}
      </div>

      {/* Content preview (truncated) */}
      <p className="text-muted-foreground text-xs line-clamp-3 mb-2">
        {source.content}
      </p>

      {/* URL if present */}
      {source.source_url && (
        <a
          href={source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline truncate block"
        >
          {source.source_url}
        </a>
      )}
    </div>
  )
}
