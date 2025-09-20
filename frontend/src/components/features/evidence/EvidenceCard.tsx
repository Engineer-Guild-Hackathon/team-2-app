import { Evidence, Member, Task } from '../../../domain/entities'
import { Card, CardContent, Badge } from '../../ui'

interface EvidenceCardProps {
  evidence: Evidence
  member?: Member
  relatedTask?: Task
}

const getKindBadgeVariant = (kind: Evidence['kind']) => {
  switch (kind) {
    case 'photo': return 'info'
    case 'voice': return 'warning'
    case 'note': return 'default'
    default: return 'default'
  }
}

const getKindLabel = (kind: Evidence['kind']) => {
  switch (kind) {
    case 'photo': return '写真'
    case 'voice': return '音声'
    case 'note': return 'メモ'
    default: return kind
  }
}

const getKindIcon = (kind: Evidence['kind']) => {
  switch (kind) {
    case 'photo':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'voice':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    case 'note':
      return (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    default:
      return null
  }
}

const getTagLabel = (tag: 'observe' | 'compare' | 'hypothesize' | 'express') => {
  switch (tag) {
    case 'observe': return '観察'
    case 'compare': return '比較'
    case 'hypothesize': return '仮説'
    case 'express': return '表現'
    default: return tag
  }
}

const getTagBadgeVariant = (tag: 'observe' | 'compare' | 'hypothesize' | 'express') => {
  switch (tag) {
    case 'observe': return 'info'
    case 'compare': return 'warning'
    case 'hypothesize': return 'danger'
    case 'express': return 'default'
    default: return 'default'
  }
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('ja-JP')
}

export function EvidenceCard({ evidence, member, relatedTask }: EvidenceCardProps) {
  return (
    <Card>
      <CardContent>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="text-blue-600">
                {getKindIcon(evidence.kind)}
              </div>
              <Badge variant={getKindBadgeVariant(evidence.kind)}>
                {getKindLabel(evidence.kind)}
              </Badge>
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(evidence.createdAt)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <strong>{member?.displayName || '不明'}</strong>
            </div>

            {relatedTask && (
              <div className="text-sm text-gray-600">
                関連タスク: {relatedTask.title}
              </div>
            )}

            {evidence.text && (
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {evidence.text}
              </div>
            )}

            {evidence.blobRef && (
              <div className="text-sm text-gray-600">
                ファイル: {evidence.blobRef}
              </div>
            )}

            {evidence.tags && evidence.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {evidence.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={getTagBadgeVariant(tag)}
                    size="sm"
                  >
                    {getTagLabel(tag)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}