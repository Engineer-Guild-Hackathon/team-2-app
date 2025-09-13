import { useState } from 'react'
import { Task, Member } from '../../domain/entities'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input, Select } from '../ui'

interface TaskListProps {
  tasks: Task[]
  members: Member[]
  loading: boolean
  onAddTask: (task: Omit<Task, 'familyUid' | 'taskId' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  onUpdateTaskProgress: (taskId: string, progress: number) => Promise<Task>
  onCompleteTask: (taskId: string) => Promise<Task>
}

const TaskList = ({ tasks, members, loading, onAddTask, onUpdateTaskProgress, onCompleteTask }: TaskListProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [formData, setFormData] = useState({
    title: '',
    type: 'homework' as Task['type'],
    subject: '',
    assigneeMemberId: '',
    due: '',
    progress: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTask) {
        // 編集の場合は進捗のみ更新可能
        await onUpdateTaskProgress(editingTask.taskId, formData.progress)
        setEditingTask(null)
      } else {
        await onAddTask({
          title: formData.title,
          type: formData.type,
          subject: formData.subject || undefined,
          assigneeMemberId: formData.assigneeMemberId,
          due: formData.due || undefined
        })
        setIsAddModalOpen(false)
      }
      
      setFormData({ 
        title: '', 
        type: 'homework', 
        subject: '', 
        assigneeMemberId: '', 
        due: '',
        progress: 0
      })
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      type: task.type,
      subject: task.subject || '',
      assigneeMemberId: task.assigneeMemberId,
      due: task.due || '',
      progress: task.progress
    })
  }

  const handleComplete = async (task: Task) => {
    if (confirm(`${task.title}を完了にしますか？`)) {
      try {
        await onCompleteTask(task.taskId)
      } catch (error) {
        console.error('Failed to complete task:', error)
      }
    }
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

  // フィルタリング
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus
    const assigneeMatch = filterAssignee === 'all' || task.assigneeMemberId === filterAssignee
    return statusMatch && assigneeMatch
  })

  // ソート（期限順、ステータス順）
  const sortedTasks = filteredTasks.sort((a, b) => {
    // 期限でソート
    if (a.due && b.due) {
      return new Date(a.due).getTime() - new Date(b.due).getTime()
    }
    if (a.due && !b.due) return -1
    if (!a.due && b.due) return 1
    
    // ステータスでソート
    const statusOrder = { 'todo': 0, 'doing': 1, 'done': 2, 'done_with_evidence': 3 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>タスク管理</CardTitle>
            <Button onClick={() => setIsAddModalOpen(true)}>
              タスクを追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* フィルター */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
            <Select
              label="ステータス"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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
              onChange={(e) => setFilterAssignee(e.target.value)}
              options={[
                { value: 'all', label: 'すべて' },
                ...members.map(member => ({
                  value: member.memberId,
                  label: member.displayName
                }))
              ]}
            />
          </div>

          {sortedTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filterStatus !== 'all' || filterAssignee !== 'all' 
                ? '条件に合うタスクがありません' 
                : 'まだタスクが登録されていません'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTasks.map((task) => {
                const assignee = members.find(m => m.memberId === task.assigneeMemberId)
                return (
                  <div key={task.taskId} className="border border-gray-200 rounded-lg p-4">
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

                        {/* 進捗バー */}
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
                          onClick={() => handleEdit(task)}
                          disabled={task.status === 'done' || task.status === 'done_with_evidence'}
                        >
                          編集
                        </Button>
                        {task.status !== 'done' && task.status !== 'done_with_evidence' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleComplete(task)}
                          >
                            完了
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || editingTask !== null}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingTask(null)
          setFormData({ 
            title: '', 
            type: 'homework', 
            subject: '', 
            assigneeMemberId: '', 
            due: '',
            progress: 0
          })
        }}
        title={editingTask ? 'タスクを編集' : 'タスクを追加'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingTask && (
            <>
              <Input
                label="タスク名"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              
              <Select
                label="種類"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Task['type'] })}
                options={[
                  { value: 'homework', label: '宿題' },
                  { value: 'test', label: 'テスト' },
                  { value: 'inquiry', label: '探究' },
                  { value: 'life', label: '生活' }
                ]}
                required
              />

              <Input
                label="科目"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="例: 算数、国語"
              />

              <Select
                label="担当者"
                value={formData.assigneeMemberId}
                onChange={(e) => setFormData({ ...formData, assigneeMemberId: e.target.value })}
                options={[
                  { value: '', label: '担当者を選択' },
                  ...members.map(member => ({
                    value: member.memberId,
                    label: member.displayName
                  }))
                ]}
                required
              />

              <Input
                label="期限"
                type="date"
                value={formData.due}
                onChange={(e) => setFormData({ ...formData, due: e.target.value })}
              />
            </>
          )}

          {editingTask && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  進捗: {formData.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingTask(null)
                setFormData({ 
                  title: '', 
                  type: 'homework', 
                  subject: '', 
                  assigneeMemberId: '', 
                  due: '',
                  progress: 0
                })
              }}
            >
              キャンセル
            </Button>
            <Button type="submit">
              {editingTask ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default TaskList