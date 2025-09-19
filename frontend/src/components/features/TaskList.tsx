import { useState } from 'react'
import { Task, Member } from '../../domain/entities'
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui'
import { TaskFilters } from './task/TaskFilters'
import { TaskCard } from './task/TaskCard'
import { TaskForm, initializeEditForm } from './task/TaskForm'
import { getFilteredAndSortedTasks } from '../../utils/taskUtils'

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

  const handleEdit = (task: Task) => {
    setEditingTask(task)
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

  const filters = {
    status: filterStatus,
    assigneeMemberId: filterAssignee
  }

  const sortedTasks = getFilteredAndSortedTasks(tasks, filters)

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
          <TaskFilters
            filterStatus={filterStatus}
            filterAssignee={filterAssignee}
            members={members}
            onFilterStatusChange={setFilterStatus}
            onFilterAssigneeChange={setFilterAssignee}
          />

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
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    assignee={assignee}
                    onEdit={handleEdit}
                    onComplete={handleComplete}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskForm
        isOpen={isAddModalOpen || editingTask !== null}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingTask(null)
        }}
        members={members}
        editingTask={editingTask}
        onSubmitAdd={onAddTask}
        onSubmitUpdate={onUpdateTaskProgress}
      />
    </>
  )
}

export default TaskList