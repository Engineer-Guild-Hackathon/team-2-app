import { useState } from 'react'
import { Member, Role } from '../../domain/entities'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input, Select } from '../ui'

interface MemberListProps {
  members: Member[]
  loading: boolean
  onAddMember: (member: Omit<Member, 'familyUid' | 'memberId' | 'createdAt' | 'updatedAt' | 'memberCode'>) => Promise<Member>
  onUpdateMember: (memberId: string, updates: Partial<Pick<Member, 'displayName' | 'birthYear'>>) => Promise<Member>
  onDeleteMember: (memberId: string) => Promise<void>
}

const MemberList = ({ members, loading, onAddMember, onUpdateMember, onDeleteMember }: MemberListProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    displayName: '',
    role: 'child' as Role,
    birthYear: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingMember) {
        await onUpdateMember(editingMember.memberId, {
          displayName: formData.displayName,
          birthYear: formData.birthYear ? parseInt(formData.birthYear) : undefined
        })
        setEditingMember(null)
      } else {
        await onAddMember({
          displayName: formData.displayName,
          role: formData.role,
          birthYear: formData.birthYear ? parseInt(formData.birthYear) : undefined
        })
        setIsAddModalOpen(false)
      }
      
      setFormData({ displayName: '', role: 'child', birthYear: '' })
    } catch (error) {
      console.error('Failed to save member:', error)
    }
  }

  const handleEdit = (member: Member) => {
    setEditingMember(member)
    setFormData({
      displayName: member.displayName,
      role: member.role,
      birthYear: member.birthYear?.toString() || ''
    })
  }

  const handleDelete = async (member: Member) => {
    if (confirm(`${member.displayName}さんを削除しますか？`)) {
      try {
        await onDeleteMember(member.memberId)
      } catch (error) {
        console.error('Failed to delete member:', error)
      }
    }
  }

  const getRoleBadgeVariant = (role: Role) => {
    return role === 'parent' ? 'info' : 'success'
  }

  const getRoleLabel = (role: Role) => {
    return role === 'parent' ? '保護者' : '子ども'
  }

  const getAge = (birthYear?: number) => {
    if (!birthYear) return null
    const currentYear = new Date().getFullYear()
    return currentYear - birthYear
  }

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
            <CardTitle>家族メンバー</CardTitle>
            <Button onClick={() => setIsAddModalOpen(true)}>
              メンバーを追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              まだメンバーが登録されていません
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.memberId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {member.displayName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">{member.displayName}</h4>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.birthYear && (
                          <span>{getAge(member.birthYear)}歳 ({member.birthYear}年生まれ)</span>
                        )}
                        {member.memberCode && (
                          <span className="ml-2">コード: {member.memberCode}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(member)}
                    >
                      編集
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(member)}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || editingMember !== null}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingMember(null)
          setFormData({ displayName: '', role: 'child', birthYear: '' })
        }}
        title={editingMember ? 'メンバーを編集' : 'メンバーを追加'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="名前"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
          />
          
          {!editingMember && (
            <Select
              label="役割"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              options={[
                { value: 'child', label: '子ども' },
                { value: 'parent', label: '保護者' }
              ]}
              required
            />
          )}
          
          <Input
            label="生まれ年"
            type="number"
            value={formData.birthYear}
            onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
            placeholder="例: 2010"
            min="1900"
            max={new Date().getFullYear()}
          />
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingMember(null)
                setFormData({ displayName: '', role: 'child', birthYear: '' })
              }}
            >
              キャンセル
            </Button>
            <Button type="submit">
              {editingMember ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export default MemberList