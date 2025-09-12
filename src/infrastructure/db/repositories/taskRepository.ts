import { TaskRepository } from '../../../domain/repositories';
import { Task } from '../../../domain/entities';
import { db } from '../dexieDB';

export class DexieTaskRepository implements TaskRepository {
  async findById(familyUid: string, taskId: string): Promise<Task | undefined> {
    return await db.tasks
      .where('[familyUid+taskId]')
      .equals([familyUid, taskId])
      .first();
  }

  async findByAssignee(familyUid: string, assigneeMemberId: string): Promise<Task[]> {
    return await db.tasks
      .where('[familyUid+assigneeMemberId]')
      .equals([familyUid, assigneeMemberId])
      .toArray();
  }

  async findByStatus(familyUid: string, status: Task['status']): Promise<Task[]> {
    return await db.tasks
      .where('[familyUid+status]')
      .equals([familyUid, status])
      .toArray();
  }

  async findAll(familyUid: string): Promise<Task[]> {
    return await db.tasks
      .where('familyUid')
      .equals(familyUid)
      .toArray();
  }

  async save(task: Task): Promise<void> {
    const existing = await this.findById(task.familyUid, task.taskId);
    
    if (existing) {
      await db.tasks
        .where('[familyUid+taskId]')
        .equals([task.familyUid, task.taskId])
        .modify({
          ...task,
          updatedAt: Date.now()
        });
    } else {
      await db.tasks.add({
        ...task,
        createdAt: task.createdAt || Date.now(),
        updatedAt: task.updatedAt || Date.now()
      });
    }
  }

  async delete(familyUid: string, taskId: string): Promise<void> {
    await db.tasks
      .where('[familyUid+taskId]')
      .equals([familyUid, taskId])
      .delete();
  }
}