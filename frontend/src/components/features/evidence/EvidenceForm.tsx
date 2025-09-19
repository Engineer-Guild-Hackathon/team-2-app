import { useState } from 'react'
import { Evidence, Member, Task } from '../../../domain/entities'
import { Modal, Input, Select, Button } from '../../ui'

interface EvidenceFormData {
  childMemberId: string
  kind: Evidence['kind']
  text: string
  blobRef: string
  taskId: string
  tags: Evidence['tags']
}

interface EvidenceFormProps {
  isOpen: boolean
  onClose: () => void
  members: Member[]
  tasks: Task[]
  onSubmit: (evidence: Omit<Evidence, 'familyUid' | 'evidenceId' | 'createdAt'>) => Promise<Evidence>
}

const INITIAL_FORM_DATA: EvidenceFormData = {
  childMemberId: '',
  kind: 'note',
  text: '',
  blobRef: '',
  taskId: '',
  tags: []
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

export function EvidenceForm({ isOpen, onClose, members, tasks, onSubmit }: EvidenceFormProps) {
  const [formData, setFormData] = useState<EvidenceFormData>(INITIAL_FORM_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 子どもメンバーのみをフィルタ
  const children = members.filter(m => m.role === 'child')

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

      await onSubmit({
        childMemberId: formData.childMemberId,
        kind: formData.kind,
        text: formData.text || undefined,
        blobRef: formData.blobRef || undefined,
        taskId: formData.taskId || undefined,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined
      })

      handleClose()
    } catch (error) {
      console.error('Failed to save evidence:', error)
      // TODO: エラー通知の表示（統一的なエラーハンドリング実装後）
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTagToggle = (tag: 'observe' | 'compare' | 'hypothesize' | 'express') => {
    const currentTags = formData.tags || []
    const hasTag = currentTags.includes(tag)

    if (hasTag) {
      setFormData({
        ...formData,
        tags: currentTags.filter(t => t !== tag)
      })
    } else {
      setFormData({
        ...formData,
        tags: [...currentTags, tag]
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="エビデンスを追加"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="子ども"
          value={formData.childMemberId}
          onChange={(e) => setFormData({ ...formData, childMemberId: e.target.value })}
          options={[
            { value: '', label: '子どもを選択' },
            ...children.map(child => ({
              value: child.memberId,
              label: child.displayName
            }))
          ]}
          required
        />

        <Select
          label="種類"
          value={formData.kind}
          onChange={(e) => setFormData({ ...formData, kind: e.target.value as Evidence['kind'] })}
          options={[
            { value: 'note', label: 'メモ' },
            { value: 'photo', label: '写真' },
            { value: 'voice', label: '音声' }
          ]}
          required
        />

        <Select
          label="関連タスク（オプション）"
          value={formData.taskId}
          onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
          options={[
            { value: '', label: '関連タスクなし' },
            ...tasks.map(task => ({
              value: task.taskId,
              label: task.title
            }))
          ]}
        />

        {formData.kind === 'note' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ内容
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="エビデンスの詳細を記録してください"
              required
            />
          </div>
        )}

        {(formData.kind === 'photo' || formData.kind === 'voice') && (
          <Input
            label="ファイル参照"
            value={formData.blobRef}
            onChange={(e) => setFormData({ ...formData, blobRef: e.target.value })}
            placeholder="ファイルパスまたはURL"
            required
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            学習タグ
          </label>
          <div className="flex flex-wrap gap-2">
            {(['observe', 'compare', 'hypothesize', 'express'] as const).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  formData.tags?.includes(tag)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {getTagLabel(tag)}
              </button>
            ))}
          </div>
        </div>

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
            {isSubmitting ? '追加中...' : '追加'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}