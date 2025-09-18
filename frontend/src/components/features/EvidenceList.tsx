import { useState } from 'react'
import { Evidence, Member, Task } from '../../domain/entities'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input, Select } from '../ui'

interface EvidenceListProps {
  evidence: Evidence[]
  members: Member[]
  tasks: Task[]
  loading: boolean
  onAddEvidence: (evidence: Omit<Evidence, 'familyUid' | 'evidenceId' | 'createdAt'>) => Promise<Evidence>
}

const EvidenceList = ({ evidence, members, tasks, loading, onAddEvidence }: EvidenceListProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [filterKind, setFilterKind] = useState<string>('all')
  const [filterChild, setFilterChild] = useState<string>('all')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [formData, setFormData] = useState({
    childMemberId: '',
    kind: 'note' as Evidence['kind'],
    text: '',
    blobRef: '',
    taskId: '',
    tags: [] as Evidence['tags']
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await onAddEvidence({
        childMemberId: formData.childMemberId,
        kind: formData.kind,
        text: formData.text || undefined,
        blobRef: formData.blobRef || undefined,
        taskId: formData.taskId || undefined,
        tags: formData.tags && formData.tags.length > 0 ? formData.tags : undefined
      })
      
      setIsAddModalOpen(false)
      setFormData({
        childMemberId: '',
        kind: 'note',
        text: '',
        blobRef: '',
        taskId: '',
        tags: []
      })
    } catch (error) {
      console.error('Failed to save evidence:', error)
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

  // 子どもメンバーのみをフィルタ
  const children = members.filter(m => m.role === 'child')

  // フィルタリング
  const filteredEvidence = evidence.filter(ev => {
    const kindMatch = filterKind === 'all' || ev.kind === filterKind
    const childMatch = filterChild === 'all' || ev.childMemberId === filterChild
    const tagMatch = filterTag === 'all' || (ev.tags && ev.tags.includes(filterTag as any))
    return kindMatch && childMatch && tagMatch
  })

  // ソート（作成日時の降順）
  const sortedEvidence = filteredEvidence.sort((a, b) => b.createdAt - a.createdAt)

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
            <CardTitle>エビデンス収集</CardTitle>
            <Button onClick={() => setIsAddModalOpen(true)}>
              エビデンスを追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* フィルター */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Select
              label="種類"
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
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
              onChange={(e) => setFilterChild(e.target.value)}
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
              onChange={(e) => setFilterTag(e.target.value)}
              options={[
                { value: 'all', label: 'すべて' },
                { value: 'observe', label: '観察' },
                { value: 'compare', label: '比較' },
                { value: 'hypothesize', label: '仮説' },
                { value: 'express', label: '表現' }
              ]}
            />
          </div>

          {sortedEvidence.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filterKind !== 'all' || filterChild !== 'all' || filterTag !== 'all'
                ? '条件に合うエビデンスがありません'
                : 'まだエビデンスが登録されていません'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedEvidence.map((ev) => {
                const child = members.find(m => m.memberId === ev.childMemberId)
                const relatedTask = ev.taskId ? tasks.find(t => t.taskId === ev.taskId) : null
                
                return (
                  <Card key={ev.evidenceId}>
                    <CardContent>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="text-blue-600">
                              {getKindIcon(ev.kind)}
                            </div>
                            <Badge variant={getKindBadgeVariant(ev.kind)}>
                              {getKindLabel(ev.kind)}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(ev.createdAt)}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            <strong>{child?.displayName || '不明'}</strong>
                          </div>

                          {relatedTask && (
                            <div className="text-sm text-gray-600">
                              関連タスク: {relatedTask.title}
                            </div>
                          )}

                          {ev.text && (
                            <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                              {ev.text}
                            </div>
                          )}

                          {ev.blobRef && (
                            <div className="text-sm text-gray-600">
                              ファイル: {ev.blobRef}
                            </div>
                          )}

                          {ev.tags && ev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {ev.tags.map((tag) => (
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
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setFormData({
            childMemberId: '',
            kind: 'note',
            text: '',
            blobRef: '',
            taskId: '',
            tags: []
          })
        }}
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
              onClick={() => {
                setIsAddModalOpen(false)
                setFormData({
                  childMemberId: '',
                  kind: 'note',
                  text: '',
                  blobRef: '',
                  taskId: '',
                  tags: []
                })
              }}
            >
              キャンセル
            </Button>
            <Button type="submit">
              追加
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default EvidenceList