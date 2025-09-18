import { EvidenceRepository } from '../../../domain/repositories';
import { Evidence } from '../../../domain/entities';
import { db } from '../dexieDB';

export class DexieEvidenceRepository implements EvidenceRepository {
  async findById(familyUid: string, evidenceId: string): Promise<Evidence | undefined> {
    return await db.evidence
      .where('[familyUid+evidenceId]')
      .equals([familyUid, evidenceId])
      .first();
  }

  async findByChild(familyUid: string, childMemberId: string): Promise<Evidence[]> {
    return await db.evidence
      .where('[familyUid+childMemberId]')
      .equals([familyUid, childMemberId])
      .toArray();
  }

  async findByTask(familyUid: string, taskId: string): Promise<Evidence[]> {
    return await db.evidence
      .where('[familyUid+taskId]')
      .equals([familyUid, taskId])
      .toArray();
  }

  async findAll(familyUid: string): Promise<Evidence[]> {
    return await db.evidence
      .where('familyUid')
      .equals(familyUid)
      .toArray();
  }

  async save(evidence: Evidence): Promise<void> {
    const existing = await this.findById(evidence.familyUid, evidence.evidenceId);
    
    if (existing) {
      await db.evidence
        .where('[familyUid+evidenceId]')
        .equals([evidence.familyUid, evidence.evidenceId])
        .modify({
          blobRef: evidence.blobRef,
          text: evidence.text,
          tags: evidence.tags
        });
    } else {
      await db.evidence.add({
        ...evidence,
        createdAt: evidence.createdAt || Date.now()
      });
    }
  }

  async delete(familyUid: string, evidenceId: string): Promise<void> {
    await db.evidence
      .where('[familyUid+evidenceId]')
      .equals([familyUid, evidenceId])
      .delete();
  }
}