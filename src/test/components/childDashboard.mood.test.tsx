import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChildDashboard from '../../components/features/ChildDashboard'
import { Task, Member } from '../../domain/entities'

describe('ChildDashboard mood badge', () => {
  const child: Member = {
    familyUid: 'fam',
    memberId: 'child1',
    role: 'child',
    displayName: 'たろう',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const tasks: Task[] = []

  it('toggles mood badges', async () => {
    render(
      <ChildDashboard
        child={child}
        tasks={tasks}
        onTaskComplete={async () => Promise.reject('not used')}
        onAddEvidence={async () => Promise.reject('not used')}
        onAddTask={async () => Promise.reject('not used')}
        onBackToRoleSelection={() => {}}
      />
    )

    // default is ふつう pressed
    const futsu = screen.getByRole('button', { name: 'ふつう' })
    expect(futsu).toHaveAttribute('aria-pressed', 'true')

    const genki = screen.getByRole('button', { name: '元気' })
    fireEvent.click(genki)
    expect(genki).toHaveAttribute('aria-pressed', 'true')
    expect(futsu).toHaveAttribute('aria-pressed', 'false')

    const tired = screen.getByRole('button', { name: 'つかれ気味' })
    fireEvent.click(tired)
    expect(tired).toHaveAttribute('aria-pressed', 'true')
    expect(genki).toHaveAttribute('aria-pressed', 'false')
  })
})

