import { useState } from 'react'
import { Evidence, Member, Task } from '../../domain/entities'
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui'
import { EvidenceForm } from './evidence/EvidenceForm'
import { EvidenceFilters } from './evidence/EvidenceFilters'
import { EvidenceCard } from './evidence/EvidenceCard'
import { getFilteredAndSortedEvidence } from '../../utils/evidenceUtils'

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

  const filters = {
    kind: filterKind,
    childMemberId: filterChild,
    tag: filterTag
  }

  const sortedEvidence = getFilteredAndSortedEvidence(evidence, filters)

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
          <EvidenceFilters
            filterKind={filterKind}
            filterChild={filterChild}
            filterTag={filterTag}
            members={members}
            onFilterKindChange={setFilterKind}
            onFilterChildChange={setFilterChild}
            onFilterTagChange={setFilterTag}
          />

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
                const member = members.find(m => m.memberId === ev.childMemberId)
                const relatedTask = ev.taskId ? tasks.find(t => t.taskId === ev.taskId) : undefined

                return (
                  <EvidenceCard
                    key={ev.evidenceId}
                    evidence={ev}
                    member={member}
                    relatedTask={relatedTask}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EvidenceForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        members={members}
        tasks={tasks}
        onSubmit={onAddEvidence}
      />
    </>
  )
}

export default EvidenceList