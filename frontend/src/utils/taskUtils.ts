import { Task } from '../domain/entities'

export interface TaskFilters {
  status: string
  assigneeMemberId: string
}

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter(task => {
    const statusMatch = filters.status === 'all' || task.status === filters.status
    const assigneeMatch = filters.assigneeMemberId === 'all' || task.assigneeMemberId === filters.assigneeMemberId
    return statusMatch && assigneeMatch
  })
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.due && b.due) {
      return new Date(a.due).getTime() - new Date(b.due).getTime()
    }
    if (a.due && !b.due) return -1
    if (!a.due && b.due) return 1

    const statusOrder = { 'todo': 0, 'doing': 1, 'done': 2, 'done_with_evidence': 3 }
    return statusOrder[a.status] - statusOrder[b.status]
  })
}

export function getFilteredAndSortedTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const filtered = filterTasks(tasks, filters)
  return sortTasks(filtered)
}