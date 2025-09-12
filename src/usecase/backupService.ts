import { BackupRepository } from '../domain/repositories';
import { Member, Task, Evidence, Recommendation } from '../domain/entities';

export interface BackupData {
  version: string;
  exportedAt: number;
  familyUid: string;
  data: {
    members: Member[];
    tasks: Task[];
    evidence: Evidence[];
    recommendations: Recommendation[];
  };
}

export class BackupService {
  constructor(private readonly backupRepository: BackupRepository) {}

  async exportData(familyUid: string): Promise<BackupData> {
    const data = await this.backupRepository.export(familyUid);
    
    return {
      version: '1.0',
      exportedAt: Date.now(),
      familyUid,
      data
    };
  }

  async exportDataAsJSON(familyUid: string): Promise<string> {
    const backupData = await this.exportData(familyUid);
    return JSON.stringify(backupData, null, 2);
  }

  async importData(backupData: BackupData): Promise<void> {
    // Validate backup format
    if (!backupData.version || !backupData.familyUid || !backupData.data) {
      throw new Error('Invalid backup format');
    }

    // Version compatibility check
    if (backupData.version !== '1.0') {
      throw new Error(`Unsupported backup version: ${backupData.version}`);
    }

    // Validate required data structure
    const { data } = backupData;
    if (!Array.isArray(data.members) || !Array.isArray(data.tasks) || 
        !Array.isArray(data.evidence) || !Array.isArray(data.recommendations)) {
      throw new Error('Invalid backup data structure');
    }

    // Ensure familyUid consistency in all data
    const allItems = [
      ...data.members,
      ...data.tasks,
      ...data.evidence,
      ...data.recommendations
    ];

    const hasInvalidFamilyUid = allItems.some(item => item.familyUid !== backupData.familyUid);
    if (hasInvalidFamilyUid) {
      throw new Error('Backup contains data with inconsistent family UID');
    }

    await this.backupRepository.import(backupData.familyUid, data);
  }

  async importFromJSON(jsonString: string): Promise<void> {
    let backupData: BackupData;
    
    try {
      backupData = JSON.parse(jsonString);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }

    await this.importData(backupData);
  }

  async clearAllData(familyUid: string): Promise<void> {
    await this.backupRepository.clear(familyUid);
  }

  async getBackupStats(familyUid: string): Promise<{
    memberCount: number;
    taskCount: number;
    evidenceCount: number;
    recommendationCount: number;
    totalItems: number;
    estimatedSize: number;
  }> {
    const data = await this.backupRepository.export(familyUid);
    const jsonString = JSON.stringify(data);
    const estimatedSize = new Blob([jsonString]).size;

    return {
      memberCount: data.members.length,
      taskCount: data.tasks.length,
      evidenceCount: data.evidence.length,
      recommendationCount: data.recommendations.length,
      totalItems: data.members.length + data.tasks.length + data.evidence.length + data.recommendations.length,
      estimatedSize
    };
  }

  // Validate data integrity before import
  private validateBackupIntegrity(backupData: BackupData): string[] {
    const errors: string[] = [];
    const { data } = backupData;

    // Check for required fields in members
    data.members.forEach((member, index) => {
      if (!member.memberId || !member.displayName || !member.role) {
        errors.push(`Member at index ${index} is missing required fields`);
      }
    });

    // Check for required fields in tasks
    data.tasks.forEach((task, index) => {
      if (!task.taskId || !task.assigneeMemberId || !task.title) {
        errors.push(`Task at index ${index} is missing required fields`);
      }
      // Check if assignee exists in members
      const assigneeExists = data.members.some(m => m.memberId === task.assigneeMemberId);
      if (!assigneeExists) {
        errors.push(`Task at index ${index} references non-existent member ${task.assigneeMemberId}`);
      }
    });

    // Check for required fields in evidence
    data.evidence.forEach((evidence, index) => {
      if (!evidence.evidenceId || !evidence.childMemberId) {
        errors.push(`Evidence at index ${index} is missing required fields`);
      }
      // Check if child member exists
      const childExists = data.members.some(m => m.memberId === evidence.childMemberId && m.role === 'child');
      if (!childExists) {
        errors.push(`Evidence at index ${index} references non-existent child ${evidence.childMemberId}`);
      }
      // Check if task exists (if taskId is provided)
      if (evidence.taskId) {
        const taskExists = data.tasks.some(t => t.taskId === evidence.taskId);
        if (!taskExists) {
          errors.push(`Evidence at index ${index} references non-existent task ${evidence.taskId}`);
        }
      }
    });

    // Check for required fields in recommendations
    data.recommendations.forEach((recommendation, index) => {
      if (!recommendation.recommendId || !recommendation.targetMemberId || !recommendation.title) {
        errors.push(`Recommendation at index ${index} is missing required fields`);
      }
      // Check if target member exists
      const targetExists = data.members.some(m => m.memberId === recommendation.targetMemberId);
      if (!targetExists) {
        errors.push(`Recommendation at index ${index} references non-existent member ${recommendation.targetMemberId}`);
      }
    });

    return errors;
  }

  async validateAndImportData(backupData: BackupData): Promise<{ success: boolean; errors: string[] }> {
    const errors = this.validateBackupIntegrity(backupData);
    
    if (errors.length > 0) {
      return { success: false, errors };
    }

    try {
      await this.importData(backupData);
      return { success: true, errors: [] };
    } catch (error) {
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown import error'] };
    }
  }
}