import { Member } from '../../../domain/entities'
import { Select } from '../../ui'

interface TaskFiltersProps {
  filterStatus: string
  filterAssignee: string
  members: Member[]
  onFilterStatusChange: (value: string) => void
  onFilterAssigneeChange: (value: string) => void
}

export function TaskFilters({
  filterStatus,
  filterAssignee,
  members,
  onFilterStatusChange,
  onFilterAssigneeChange
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
      <Select
        label="ステータス"
        value={filterStatus}
        onChange={(e) => onFilterStatusChange(e.target.value)}
        options={[
          { value: 'all', label: 'すべて' },
          { value: 'todo', label: '未着手' },
          { value: 'doing', label: '進行中' },
          { value: 'done', label: '完了' },
          { value: 'done_with_evidence', label: '完了(記録あり)' }
        ]}
      />
      <Select
        label="担当者"
        value={filterAssignee}
        onChange={(e) => onFilterAssigneeChange(e.target.value)}
        options={[
          { value: 'all', label: 'すべて' },
          ...members.map(member => ({
            value: member.memberId,
            label: member.displayName
          }))
        ]}
      />
    </div>
  )
}