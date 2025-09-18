import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChildEvidenceUpload from '../../components/features/ChildEvidenceUpload'
import { Member, Task } from '../../domain/entities'

describe('ChildEvidenceUpload initial task selection', () => {
  const child: Member = {
    familyUid: 'fam',
    memberId: 'child1',
    role: 'child',
    displayName: 'たろう',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const tasks: Task[] = [
    {
      familyUid: 'fam',
      taskId: 't1',
      assigneeMemberId: 'child1',
      title: '漢字ドリル1ページ',
      type: 'homework',
      status: 'todo',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  it('preselects task when initialTaskId is provided', async () => {
    render(
      <ChildEvidenceUpload
        child={child}
        tasks={tasks}
        initialTaskId={'t1'}
        onAddEvidence={async () => tasks as unknown as any}
        onBack={() => {}}
      />
    )

    const taskBtn = screen.getByRole('button', { name: /漢字ドリル1ページ/ })
    expect(taskBtn).toHaveAttribute('aria-pressed', 'true')
  })
})
