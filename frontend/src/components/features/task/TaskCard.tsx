import { Task, Member } from '../../../domain/entities'
import { Button, Badge } from '../../ui'

interface TaskCardProps {
  task: Task
  assignee?: Member
  onEdit: (task: Task) => void
  onComplete: (task: Task) => void
}

const getStatusBadgeVariant = (status: Task['status']) => {
  switch (status) {
    case 'todo': return 'default'
    case 'doing': return 'warning'
    case 'done': return 'success'
    case 'done_with_evidence': return 'info'
    default: return 'default'
  }
}

const getStatusLabel = (status: Task['status']) => {
  switch (status) {
    case 'todo': return '未着手'
    case 'doing': return '進行中'
    case 'done': return '完了'
    case 'done_with_evidence': return '完了(記録あり)'
    default: return status
  }
}

const getTypeLabel = (type: Task['type']) => {
  switch (type) {
    case 'test': return 'テスト'
    case 'homework': return '宿題'
    case 'inquiry': return '探究'
    case 'life': return '生活'
    default: return type
  }
}

const getTypeBadgeVariant = (type: Task['type']) => {
  switch (type) {
    case 'test': return 'danger'
    case 'homework': return 'warning'
    case 'inquiry': return 'info'
    case 'life': return 'success'
    default: return 'default'
  }
}

const formatDueDate = (due?: string) => {
  if (!due) return null
  const date = new Date(due)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return '期限切れ'
  if (diffDays === 0) return '今日'
  if (diffDays === 1) return '明日'
  return `${diffDays}日後`
}

const getDueDateColor = (due?: string) => {
  if (!due) return 'text-gray-500'
  const date = new Date(due)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'text-red-600'
  if (diffDays <= 1) return 'text-orange-600'
  if (diffDays <= 3) return 'text-yellow-600'
  return 'text-gray-500'
}

export function TaskCard({ task, assignee, onEdit, onComplete }: TaskCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
            <Badge variant={getTypeBadgeVariant(task.type)}>
              {getTypeLabel(task.type)}
            </Badge>
            <Badge variant={getStatusBadgeVariant(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div>担当: {assignee?.displayName || '不明'}</div>
            {task.subject && <div>科目: {task.subject}</div>}
            {task.due && (
              <div className={getDueDateColor(task.due)}>
                期限: {new Date(task.due).toLocaleDateString('ja-JP')} ({formatDueDate(task.due)})
              </div>
            )}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>進捗</span>
              <span>{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(task)}
            disabled={task.status === 'done' || task.status === 'done_with_evidence'}
          >
            編集
          </Button>
          {task.status !== 'done' && task.status !== 'done_with_evidence' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onComplete(task)}
            >
              完了
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}