import { Member } from '../../../domain/entities'
import { Select } from '../../ui'

interface EvidenceFiltersProps {
  filterKind: string
  filterChild: string
  filterTag: string
  members: Member[]
  onFilterKindChange: (value: string) => void
  onFilterChildChange: (value: string) => void
  onFilterTagChange: (value: string) => void
}

export function EvidenceFilters({
  filterKind,
  filterChild,
  filterTag,
  members,
  onFilterKindChange,
  onFilterChildChange,
  onFilterTagChange
}: EvidenceFiltersProps) {
  // 子どもメンバーのみをフィルタ
  const children = members.filter(m => m.role === 'child')

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Select
        label="種類"
        value={filterKind}
        onChange={(e) => onFilterKindChange(e.target.value)}
        options={[
          { value: 'all', label: 'すべて' },
          { value: 'photo', label: '写真' },
          { value: 'voice', label: '音声' },
          { value: 'note', label: 'メモ' }
        ]}
      />
      <Select
        label="子ども"
        value={filterChild}
        onChange={(e) => onFilterChildChange(e.target.value)}
        options={[
          { value: 'all', label: 'すべて' },
          ...children.map(child => ({
            value: child.memberId,
            label: child.displayName
          }))
        ]}
      />
      <Select
        label="タグ"
        value={filterTag}
        onChange={(e) => onFilterTagChange(e.target.value)}
        options={[
          { value: 'all', label: 'すべて' },
          { value: 'observe', label: '観察' },
          { value: 'compare', label: '比較' },
          { value: 'hypothesize', label: '仮説' },
          { value: 'express', label: '表現' }
        ]}
      />
    </div>
  )
}