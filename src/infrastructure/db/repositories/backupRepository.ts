import { BackupRepository } from '../../../domain/repositories';
import { Member, Task, Evidence, Recommendation } from '../../../domain/entities';
import { db } from '../dexieDB';

export class DexieBackupRepository implements BackupRepository {
  async export(familyUid: string): Promise<{
    members: Member[];
    tasks: Task[];
    evidence: Evidence[];
    recommendations: Recommendation[];
  }> {
    const exportData = await db.exportFamilyData(familyUid);
    return exportData.data;
  }

  async import(familyUid: string, data: {
    members: Member[];
    tasks: Task[];
    evidence: Evidence[];
    recommendations: Recommendation[];
  }): Promise<void> {
    await db.importFamilyData({ familyUid, data });
  }

  async clear(familyUid: string): Promise<void> {
    await db.clearFamilyData(familyUid);
  }

  // Additional utility methods for backup management
  async exportToJSON(familyUid: string): Promise<string> {
    const data = await this.export(familyUid);
    return JSON.stringify({
      version: '1.0',
      exportedAt: Date.now(),
      familyUid,
      data
    }, null, 2);
  }

  async importFromJSON(jsonData: string): Promise<void> {
    const parsed = JSON.parse(jsonData);
    
    if (!parsed.version || !parsed.familyUid || !parsed.data) {
      throw new Error('Invalid backup format');
    }

    await this.import(parsed.familyUid, parsed.data);
  }

  // Get backup statistics
  async getBackupStats(familyUid: string): Promise<{
    memberCount: number;
    taskCount: number;
    evidenceCount: number;
    recommendationCount: number;
    totalSize: number;
  }> {
    const data = await this.export(familyUid);
    const jsonString = JSON.stringify(data);
    
    return {
      memberCount: data.members.length,
      taskCount: data.tasks.length,
      evidenceCount: data.evidence.length,
      recommendationCount: data.recommendations.length,
      totalSize: new Blob([jsonString]).size
    };
  }
}