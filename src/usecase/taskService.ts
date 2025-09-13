import { Task } from '../domain/entities';
import { TaskRepository, MemberRepository } from '../domain/repositories';
import { TaskId, TaskValidationService } from '../domain';

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async createTask(params: {
    familyUid: string;
    assigneeMemberId: string;
    title: string;
    type: Task['type'];
    subject?: string;
    due?: string;
  }): Promise<Task> {
    // Verify assignee exists
    const assignee = await this.memberRepository.findById(params.familyUid, params.assigneeMemberId);
    if (!assignee) {
      throw new Error('Assignee member not found');
    }

    const taskId = TaskId.generate().toString();
    
    const task: Task = {
      familyUid: params.familyUid,
      taskId,
      assigneeMemberId: params.assigneeMemberId,
      title: params.title.trim(),
      type: params.type,
      subject: params.subject?.trim(),
      status: 'todo',
      progress: 0,
      due: params.due,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.taskRepository.save(task);
    return task;
  }

  async updateTask(
    familyUid: string,
    taskId: string,
    updates: Partial<Pick<Task, 'title' | 'type' | 'subject' | 'status' | 'progress' | 'due'>>
  ): Promise<Task> {
    const existingTask = await this.taskRepository.findById(familyUid, taskId);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    // Validate progress if updated
    if (updates.progress !== undefined && !TaskValidationService.validateTaskProgress(updates.progress)) {
      throw new Error('Progress must be between 0 and 100');
    }

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      title: updates.title ? updates.title.trim() : existingTask.title,
      subject: updates.subject ? updates.subject.trim() : existingTask.subject,
      updatedAt: Date.now()
    };

    await this.taskRepository.save(updatedTask);
    return updatedTask;
  }

  async updateTaskProgress(familyUid: string, taskId: string, progress: number): Promise<Task> {
    if (!TaskValidationService.validateTaskProgress(progress)) {
      throw new Error('Progress must be between 0 and 100');
    }

    const task = await this.taskRepository.findById(familyUid, taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Auto-update status based on progress
    let status = task.status;
    if (progress === 0 && status === 'doing') {
      status = 'todo';
    } else if (progress > 0 && progress < 100 && status === 'todo') {
      status = 'doing';
    } else if (progress === 100 && status !== 'done_with_evidence') {
      status = 'done';
    }

    return await this.updateTask(familyUid, taskId, { progress, status });
  }

  async completeTask(familyUid: string, taskId: string): Promise<Task> {
    return await this.updateTask(familyUid, taskId, { 
      status: 'done', 
      progress: 100 
    });
  }

  async completeTaskWithEvidence(familyUid: string, taskId: string): Promise<Task> {
    return await this.updateTask(familyUid, taskId, { 
      status: 'done_with_evidence', 
      progress: 100 
    });
  }

  async getTask(familyUid: string, taskId: string): Promise<Task | undefined> {
    return await this.taskRepository.findById(familyUid, taskId);
  }

  async getTasksByAssignee(familyUid: string, assigneeMemberId: string): Promise<Task[]> {
    return await this.taskRepository.findByAssignee(familyUid, assigneeMemberId);
  }

  async getTasksByStatus(familyUid: string, status: Task['status']): Promise<Task[]> {
    return await this.taskRepository.findByStatus(familyUid, status);
  }

  async getAllTasks(familyUid: string): Promise<Task[]> {
    return await this.taskRepository.findAll(familyUid);
  }

  async getOverdueTasks(familyUid: string): Promise<Task[]> {
    const allTasks = await this.taskRepository.findAll(familyUid);
    return allTasks.filter(task => 
      task.due && TaskValidationService.isTaskOverdue(task.due) && 
      task.status !== 'done' && task.status !== 'done_with_evidence'
    );
  }

  async deleteTask(familyUid: string, taskId: string): Promise<void> {
    const task = await this.taskRepository.findById(familyUid, taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    await this.taskRepository.delete(familyUid, taskId);
  }

  // Analytics methods
  async getTaskStatsByAssignee(familyUid: string, assigneeMemberId: string): Promise<{
    total: number;
    todo: number;
    doing: number;
    done: number;
    done_with_evidence: number;
    overdue: number;
    completionRate: number;
  }> {
    const tasks = await this.getTasksByAssignee(familyUid, assigneeMemberId);
    const overdueTasks = tasks.filter(task => 
      task.due && TaskValidationService.isTaskOverdue(task.due) && 
      task.status !== 'done' && task.status !== 'done_with_evidence'
    );

    const statusCounts = {
      todo: tasks.filter(t => t.status === 'todo').length,
      doing: tasks.filter(t => t.status === 'doing').length,
      done: tasks.filter(t => t.status === 'done').length,
      done_with_evidence: tasks.filter(t => t.status === 'done_with_evidence').length,
    };

    const completedTasks = statusCounts.done + statusCounts.done_with_evidence;
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

    return {
      total: tasks.length,
      ...statusCounts,
      overdue: overdueTasks.length,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }
}