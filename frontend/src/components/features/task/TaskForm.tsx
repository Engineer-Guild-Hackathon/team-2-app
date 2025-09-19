import { useState } from 'react'
import { Task, Member } from '../../../domain/entities'
import { Modal, Input, Select, Button } from '../../ui'

interface TaskFormData {
  title: string
  type: Task['type']
  subject: string
  assigneeMemberId: string
  due: string
  progress: number
}

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  members: Member[]
  editingTask: Task | null
  onSubmitAdd: (task: Omit<Task, 'familyUid' | 'taskId' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  onSubmitUpdate: (taskId: string, progress: number) => Promise<Task>
}

const INITIAL_FORM_DATA: TaskFormData = {
  title: '',
  type: 'homework',
  subject: '',
  assigneeMemberId: '',
  due: '',
  progress: 0
}

export function TaskForm({
  isOpen,
  onClose,
  members,
  editingTask,
  onSubmitAdd,
  onSubmitUpdate
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      if (editingTask) {
        await onSubmitUpdate(editingTask.taskId, formData.progress)
      } else {
        await onSubmitAdd({
          title: formData.title,
          type: formData.type,
          subject: formData.subject || undefined,
          assigneeMemberId: formData.assigneeMemberId,
          due: formData.due || undefined
        })
      }

      handleClose()
    } catch (error) {
      console.error('Failed to save task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const initializeEditForm = (task: Task) => {
    setFormData({
      title: task.title,
      type: task.type,
      subject: task.subject || '',
      assigneeMemberId: task.assigneeMemberId,
      due: task.due || '',
      progress: task.progress
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
                step="25"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '処理中...' : (editingTask ? '更新' : '追加')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function initializeEditForm(task: Task, setFormData: (data: TaskFormData) => void) {
  setFormData({
    title: task.title,
    type: task.type,
    subject: task.subject || '',
    assigneeMemberId: task.assigneeMemberId,
    due: task.due || '',
    progress: task.progress
  })
}