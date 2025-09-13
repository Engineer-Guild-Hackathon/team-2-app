import { Evidence } from '../domain/entities';
import { EvidenceRepository, MemberRepository, TaskRepository } from '../domain/repositories';
import { EvidenceId, TaskValidationService } from '../domain';

export class EvidenceService {
  constructor(
    private readonly evidenceRepository: EvidenceRepository,
    private readonly memberRepository: MemberRepository,
    private readonly taskRepository: TaskRepository
  ) {}

  async createEvidence(params: {
    familyUid: string;
    childMemberId: string;
    taskId?: string;
    kind: Evidence['kind'];
    blobRef?: string;
    text?: string;
    tags?: Evidence['tags'];
  }): Promise<Evidence> {
    // Verify child member exists and is actually a child
    const childMember = await this.memberRepository.findById(params.familyUid, params.childMemberId);
    if (!childMember) {
      throw new Error('Child member not found');
    }
    if (childMember.role !== 'child') {
      throw new Error('Member must be a child to create evidence');
    }

    // Verify task exists if taskId is provided
    if (params.taskId) {
      const task = await this.taskRepository.findById(params.familyUid, params.taskId);
      if (!task) {
        throw new Error('Task not found');
      }
      if (!TaskValidationService.canAddEvidence(task.status)) {
        throw new Error('Cannot add evidence to task with current status');
      }
    }

    // Validate evidence content
    if (!params.blobRef && !params.text) {
      throw new Error('Evidence must have either blobRef or text content');
    }

    const evidenceId = EvidenceId.generate().toString();
    
    const evidence: Evidence = {
      familyUid: params.familyUid,
      evidenceId,
      taskId: params.taskId,
      childMemberId: params.childMemberId,
      kind: params.kind,
      blobRef: params.blobRef,
      text: params.text?.trim(),
      tags: params.tags,
      createdAt: Date.now()
    };

    await this.evidenceRepository.save(evidence);

    // If evidence is linked to a task, update task status if needed
    if (params.taskId) {
      const task = await this.taskRepository.findById(params.familyUid, params.taskId);
      if (task && task.status === 'done') {
        // Auto-upgrade to done_with_evidence
        await this.taskRepository.save({
          ...task,
          status: 'done_with_evidence',
          updatedAt: Date.now()
        });
      }
    }

    return evidence;
  }

  async updateEvidence(
    familyUid: string,
    evidenceId: string,
    updates: Partial<Pick<Evidence, 'blobRef' | 'text' | 'tags'>>
  ): Promise<Evidence> {
    const existingEvidence = await this.evidenceRepository.findById(familyUid, evidenceId);
    if (!existingEvidence) {
      throw new Error('Evidence not found');
    }

    // Validate that updated evidence still has content
    const updatedEvidence = { ...existingEvidence, ...updates };
    if (!updatedEvidence.blobRef && !updatedEvidence.text) {
      throw new Error('Evidence must have either blobRef or text content');
    }

    const finalEvidence: Evidence = {
      ...existingEvidence,
      ...updates,
      text: updates.text ? updates.text.trim() : existingEvidence.text
    };

    await this.evidenceRepository.save(finalEvidence);
    return finalEvidence;
  }

  async getEvidence(familyUid: string, evidenceId: string): Promise<Evidence | undefined> {
    return await this.evidenceRepository.findById(familyUid, evidenceId);
  }

  async getEvidenceByChild(familyUid: string, childMemberId: string): Promise<Evidence[]> {
    return await this.evidenceRepository.findByChild(familyUid, childMemberId);
  }

  async getEvidenceByTask(familyUid: string, taskId: string): Promise<Evidence[]> {
    return await this.evidenceRepository.findByTask(familyUid, taskId);
  }

  async getAllEvidence(familyUid: string): Promise<Evidence[]> {
    return await this.evidenceRepository.findAll(familyUid);
  }

  async deleteEvidence(familyUid: string, evidenceId: string): Promise<void> {
    const evidence = await this.evidenceRepository.findById(familyUid, evidenceId);
    if (!evidence) {
      throw new Error('Evidence not found');
    }

    await this.evidenceRepository.delete(familyUid, evidenceId);

    // If evidence was linked to a task, check if task status should be downgraded
    if (evidence.taskId) {
      const remainingEvidence = await this.evidenceRepository.findByTask(familyUid, evidence.taskId);
      if (remainingEvidence.length === 0) {
        const task = await this.taskRepository.findById(familyUid, evidence.taskId);
        if (task && task.status === 'done_with_evidence') {
          // Downgrade to done since no evidence remains
          await this.taskRepository.save({
            ...task,
            status: 'done',
            updatedAt: Date.now()
          });
        }
      }
    }
  }

  // Analytics methods
  async getEvidenceStatsByChild(familyUid: string, childMemberId: string): Promise<{
    total: number;
    byKind: {
      photo: number;
      voice: number;
      note: number;
    };
    byTags: Record<string, number>;
    withTasks: number;
    withoutTasks: number;
  }> {
    const evidence = await this.getEvidenceByChild(familyUid, childMemberId);
    
    const byKind = {
      photo: evidence.filter(e => e.kind === 'photo').length,
      voice: evidence.filter(e => e.kind === 'voice').length,
      note: evidence.filter(e => e.kind === 'note').length,
    };

    const tagCounts: Record<string, number> = {};
    evidence.forEach(e => {
      if (e.tags) {
        e.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return {
      total: evidence.length,
      byKind,
      byTags: tagCounts,
      withTasks: evidence.filter(e => e.taskId).length,
      withoutTasks: evidence.filter(e => !e.taskId).length,
    };
  }

  async getRecentEvidence(familyUid: string, limit: number = 10): Promise<Evidence[]> {
    const allEvidence = await this.evidenceRepository.findAll(familyUid);
    return allEvidence
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}