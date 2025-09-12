import Dexie, { Table } from 'dexie';
import { Member, Task, Evidence, Recommendation } from '../../domain/entities';

export class HomeLogDB extends Dexie {
  members!: Table<Member, number>;
  tasks!: Table<Task, number>;
  evidence!: Table<Evidence, number>;
  recommendations!: Table<Recommendation, number>;

  constructor() {
    super('homelog-v1');
    
    this.version(1).stores({
      members: '++id, familyUid, memberId, role, [familyUid+role], [familyUid+memberId]',
      tasks: '++id, familyUid, taskId, assigneeMemberId, status, [familyUid+assigneeMemberId], [familyUid+status], [familyUid+taskId]',
      evidence: '++id, familyUid, evidenceId, childMemberId, taskId, [familyUid+childMemberId], [familyUid+taskId], [familyUid+evidenceId]',
      recommendations: '++id, familyUid, recommendId, targetMemberId, kind, [familyUid+targetMemberId], [familyUid+kind], [familyUid+recommendId]'
    });

    // Add hooks for data validation
    this.members.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = obj.createdAt || Date.now();
      obj.updatedAt = obj.updatedAt || Date.now();
    });

    this.members.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = Date.now();
    });

    this.tasks.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = obj.createdAt || Date.now();
      obj.updatedAt = obj.updatedAt || Date.now();
    });

    this.tasks.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = Date.now();
    });

    this.evidence.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = obj.createdAt || Date.now();
    });

    this.recommendations.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = obj.createdAt || Date.now();
    });
  }

  // Utility method to clear all data for a specific family
  async clearFamilyData(familyUid: string): Promise<void> {
    await this.transaction('rw', [this.members, this.tasks, this.evidence, this.recommendations], async () => {
      await this.members.where('familyUid').equals(familyUid).delete();
      await this.tasks.where('familyUid').equals(familyUid).delete();
      await this.evidence.where('familyUid').equals(familyUid).delete();
      await this.recommendations.where('familyUid').equals(familyUid).delete();
    });
  }

  // Export all data for a specific family
  async exportFamilyData(familyUid: string) {
    const [members, tasks, evidence, recommendations] = await Promise.all([
      this.members.where('familyUid').equals(familyUid).toArray(),
      this.tasks.where('familyUid').equals(familyUid).toArray(),
      this.evidence.where('familyUid').equals(familyUid).toArray(),
      this.recommendations.where('familyUid').equals(familyUid).toArray()
    ]);

    return {
      familyUid,
      exportedAt: Date.now(),
      version: '1.0',
      data: {
        members,
        tasks,
        evidence,
        recommendations
      }
    };
  }

  // Import data for a specific family
  async importFamilyData(exportData: {
    familyUid: string;
    data: {
      members: Member[];
      tasks: Task[];
      evidence: Evidence[];
      recommendations: Recommendation[];
    };
  }): Promise<void> {
    await this.transaction('rw', [this.members, this.tasks, this.evidence, this.recommendations], async () => {
      // Clear existing data for this family
      await this.clearFamilyData(exportData.familyUid);

      // Import new data
      await this.members.bulkAdd(exportData.data.members);
      await this.tasks.bulkAdd(exportData.data.tasks);
      await this.evidence.bulkAdd(exportData.data.evidence);
      await this.recommendations.bulkAdd(exportData.data.recommendations);
    });
  }
}

// Singleton instance
export const db = new HomeLogDB();