import { RecommendationRepository } from '../../../domain/repositories';
import { Recommendation } from '../../../domain/entities';
import { db } from '../dexieDB';

export class DexieRecommendationRepository implements RecommendationRepository {
  async findById(familyUid: string, recommendId: string): Promise<Recommendation | undefined> {
    return await db.recommendations
      .where('[familyUid+recommendId]')
      .equals([familyUid, recommendId])
      .first();
  }

  async findByTarget(familyUid: string, targetMemberId: string): Promise<Recommendation[]> {
    return await db.recommendations
      .where('[familyUid+targetMemberId]')
      .equals([familyUid, targetMemberId])
      .toArray();
  }

  async findByKind(familyUid: string, kind: Recommendation['kind']): Promise<Recommendation[]> {
    return await db.recommendations
      .where('[familyUid+kind]')
      .equals([familyUid, kind])
      .toArray();
  }

  async findAll(familyUid: string): Promise<Recommendation[]> {
    return await db.recommendations
      .where('familyUid')
      .equals(familyUid)
      .toArray();
  }

  async save(recommendation: Recommendation): Promise<void> {
    const existing = await this.findById(recommendation.familyUid, recommendation.recommendId);
    
    if (existing) {
      await db.recommendations
        .where('[familyUid+recommendId]')
        .equals([recommendation.familyUid, recommendation.recommendId])
        .modify(recommendation);
    } else {
      await db.recommendations.add({
        ...recommendation,
        createdAt: recommendation.createdAt || Date.now()
      });
    }
  }

  async delete(familyUid: string, recommendId: string): Promise<void> {
    await db.recommendations
      .where('[familyUid+recommendId]')
      .equals([familyUid, recommendId])
      .delete();
  }
}