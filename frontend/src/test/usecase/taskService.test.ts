import { describe, it, expect, beforeEach } from 'vitest'
import { TaskService } from '../../usecase/taskService'
import { MemberService } from '../../usecase/memberService'
import { DexieTaskRepository } from '../../infrastructure/db/repositories/taskRepository'
import { DexieMemberRepository } from '../../infrastructure/db/repositories/memberRepository'
import { Task, Member } from '../../domain/entities'
import { db } from '../../infrastructure/db/dexieDB'

describe('TaskService', () => {
  let taskService: TaskService
  let memberService: MemberService
  let taskRepository: DexieTaskRepository
  let memberRepository: DexieMemberRepository
  const familyUid = 'test-family-uid'
  let testMember: Member

  beforeEach(async () => {
    taskRepository = new DexieTaskRepository()
    memberRepository = new DexieMemberRepository()
    memberService = new MemberService(memberRepository)
    taskService = new TaskService(taskRepository, memberRepository)
    
    // Clear test data
    await db.clearFamilyData(familyUid)
    
    // Create test member
    testMember = await memberService.createMember({
      familyUid,
      role: 'child',
      displayName: 'テスト子ども',
    })
  })

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const params = {
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'テストタスク',
        type: 'homework' as const,
        subject: '算数',
        due: '2024-12-31'
      }

      const task = await taskService.createTask(params)

      expect(task.familyUid).toBe(familyUid)
      expect(task.assigneeMemberId).toBe(testMember.memberId)
      expect(task.title).toBe('テストタスク')
      expect(task.type).toBe('homework')
      expect(task.subject).toBe('算数')
      expect(task.status).toBe('todo')
      expect(task.progress).toBe(0)
      expect(task.due).toBe('2024-12-31')
      expect(task.taskId).toBeDefined()
      expect(task.createdAt).toBeDefined()
      expect(task.updatedAt).toBeDefined()
    })

    it('should throw error for non-existent assignee', async () => {
      const params = {
        familyUid,
        assigneeMemberId: 'non-existent',
        title: 'テストタスク',
        type: 'homework' as const,
      }

      await expect(taskService.createTask(params))
        .rejects.toThrow('Assignee member not found')
    })

    it('should trim title', async () => {
      const params = {
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: '  テストタスク  ',
        type: 'homework' as const,
      }

      const task = await taskService.createTask(params)
      expect(task.title).toBe('テストタスク')
    })
  })

  describe('updateTaskProgress', () => {
    let testTask: Task

    beforeEach(async () => {
      testTask = await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'テストタスク',
        type: 'homework',
      })
    })

    it('should update progress and status correctly', async () => {
      const updatedTask = await taskService.updateTaskProgress(
        familyUid,
        testTask.taskId,
        50
      )

      expect(updatedTask.progress).toBe(50)
      expect(updatedTask.status).toBe('doing')
    })

    it('should set status to done when progress is 100', async () => {
      const updatedTask = await taskService.updateTaskProgress(
        familyUid,
        testTask.taskId,
        100
      )

      expect(updatedTask.progress).toBe(100)
      expect(updatedTask.status).toBe('done')
    })

    it('should throw error for invalid progress', async () => {
      await expect(taskService.updateTaskProgress(familyUid, testTask.taskId, 150))
        .rejects.toThrow('Progress must be between 0 and 100')

      await expect(taskService.updateTaskProgress(familyUid, testTask.taskId, -10))
        .rejects.toThrow('Progress must be between 0 and 100')
    })

    it('should throw error for non-existent task', async () => {
      await expect(taskService.updateTaskProgress(familyUid, 'non-existent', 50))
        .rejects.toThrow('Task not found')
    })
  })

  describe('completeTask and completeTaskWithEvidence', () => {
    let testTask: Task

    beforeEach(async () => {
      testTask = await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'テストタスク',
        type: 'homework',
      })
    })

    it('should complete task', async () => {
      const completedTask = await taskService.completeTask(familyUid, testTask.taskId)

      expect(completedTask.status).toBe('done')
      expect(completedTask.progress).toBe(100)
    })

    it('should complete task with evidence', async () => {
      const completedTask = await taskService.completeTaskWithEvidence(
        familyUid,
        testTask.taskId
      )

      expect(completedTask.status).toBe('done_with_evidence')
      expect(completedTask.progress).toBe(100)
    })
  })

  describe('getTasksByAssignee', () => {
    beforeEach(async () => {
      const anotherMember = await memberService.createMember({
        familyUid,
        role: 'child',
        displayName: '他の子ども',
      })

      // Create tasks for testMember
      await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'タスク1',
        type: 'homework',
      })
      await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'タスク2',
        type: 'test',
      })

      // Create task for anotherMember
      await taskService.createTask({
        familyUid,
        assigneeMemberId: anotherMember.memberId,
        title: 'タスク3',
        type: 'life',
      })
    })

    it('should return tasks only for specific assignee', async () => {
      const tasks = await taskService.getTasksByAssignee(familyUid, testMember.memberId)
      
      expect(tasks).toHaveLength(2)
      tasks.forEach(task => expect(task.assigneeMemberId).toBe(testMember.memberId))
    })
  })

  describe('getTaskStatsByAssignee', () => {
    beforeEach(async () => {
      // Create tasks with different statuses
      const task1 = await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'TODOタスク',
        type: 'homework',
      })

      const task2 = await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'DOINGタスク',
        type: 'homework',
      })
      await taskService.updateTaskProgress(familyUid, task2.taskId, 50)

      const task3 = await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: '完了タスク',
        type: 'homework',
      })
      await taskService.completeTask(familyUid, task3.taskId)

      const task4 = await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: 'エビデンス付きタスク',
        type: 'homework',
      })
      await taskService.completeTaskWithEvidence(familyUid, task4.taskId)
    })

    it('should return correct task statistics', async () => {
      const stats = await taskService.getTaskStatsByAssignee(
        familyUid,
        testMember.memberId
      )

      expect(stats.total).toBe(4)
      expect(stats.todo).toBe(1)
      expect(stats.doing).toBe(1)
      expect(stats.done).toBe(1)
      expect(stats.done_with_evidence).toBe(1)
      expect(stats.completionRate).toBe(50) // 2 completed out of 4 total
    })
  })

  describe('getOverdueTasks', () => {
    it('should return overdue tasks', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: '期限切れタスク',
        type: 'homework',
        due: pastDate.toISOString().split('T')[0]
      })

      await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: '未来のタスク',
        type: 'homework',
        due: '2030-12-31'
      })

      const overdueTasks = await taskService.getOverdueTasks(familyUid)
      expect(overdueTasks).toHaveLength(1)
      expect(overdueTasks[0].title).toBe('期限切れタスク')
    })

    it('should not return completed overdue tasks', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const task = await taskService.createTask({
        familyUid,
        assigneeMemberId: testMember.memberId,
        title: '完了した期限切れタスク',
        type: 'homework',
        due: pastDate.toISOString().split('T')[0]
      })

      await taskService.completeTask(familyUid, task.taskId)

      const overdueTasks = await taskService.getOverdueTasks(familyUid)
      expect(overdueTasks).toHaveLength(0)
    })
  })
})