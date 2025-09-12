import { Recommendation } from '../domain/entities';
import { RecommendationRepository, MemberRepository } from '../domain/repositories';
import { RecommendId } from '../domain';

export class RecommendationService {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
    private readonly memberRepository: MemberRepository
  ) {}

  async createRecommendation(params: {
    familyUid: string;
    targetMemberId: string;
    kind: Recommendation['kind'];
    title: string;
    reason: string;
  }): Promise<Recommendation> {
    // Verify target member exists
    const targetMember = await this.memberRepository.findById(params.familyUid, params.targetMemberId);
    if (!targetMember) {
      throw new Error('Target member not found');
    }

    const recommendId = RecommendId.generate().toString();
    
    const recommendation: Recommendation = {
      familyUid: params.familyUid,
      recommendId,
      targetMemberId: params.targetMemberId,
      kind: params.kind,
      title: params.title.trim(),
      reason: params.reason.trim(),
      createdAt: Date.now()
    };

    // Basic validation
    if (!recommendation.title) {
      throw new Error('Recommendation title is required');
    }
    if (!recommendation.reason) {
      throw new Error('Recommendation reason is required');
    }

    await this.recommendationRepository.save(recommendation);
    return recommendation;
  }

  async updateRecommendation(
    familyUid: string,
    recommendId: string,
    updates: Partial<Pick<Recommendation, 'title' | 'reason'>>
  ): Promise<Recommendation> {
    const existingRecommendation = await this.recommendationRepository.findById(familyUid, recommendId);
    if (!existingRecommendation) {
      throw new Error('Recommendation not found');
    }

    const updatedRecommendation: Recommendation = {
      ...existingRecommendation,
      ...updates,
      title: updates.title ? updates.title.trim() : existingRecommendation.title,
      reason: updates.reason ? updates.reason.trim() : existingRecommendation.reason
    };

    // Validate updated fields
    if (!updatedRecommendation.title) {
      throw new Error('Recommendation title is required');
    }
    if (!updatedRecommendation.reason) {
      throw new Error('Recommendation reason is required');
    }

    await this.recommendationRepository.save(updatedRecommendation);
    return updatedRecommendation;
  }

  async getRecommendation(familyUid: string, recommendId: string): Promise<Recommendation | undefined> {
    return await this.recommendationRepository.findById(familyUid, recommendId);
  }

  async getRecommendationsByTarget(familyUid: string, targetMemberId: string): Promise<Recommendation[]> {
    return await this.recommendationRepository.findByTarget(familyUid, targetMemberId);
  }

  async getRecommendationsByKind(familyUid: string, kind: Recommendation['kind']): Promise<Recommendation[]> {
    return await this.recommendationRepository.findByKind(familyUid, kind);
  }

  async getAllRecommendations(familyUid: string): Promise<Recommendation[]> {
    return await this.recommendationRepository.findAll(familyUid);
  }

  async deleteRecommendation(familyUid: string, recommendId: string): Promise<void> {
    const recommendation = await this.recommendationRepository.findById(familyUid, recommendId);
    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    await this.recommendationRepository.delete(familyUid, recommendId);
  }

  // Generate automatic recommendations based on evidence patterns
  async generateRecommendationsForChild(familyUid: string, childMemberId: string): Promise<Recommendation[]> {
    const child = await this.memberRepository.findById(familyUid, childMemberId);
    if (!child || child.role !== 'child') {
      throw new Error('Child member not found');
    }

    // This would typically involve more sophisticated analysis of evidence and tasks
    // For now, we'll create some basic recommendations based on common patterns
    
    const recommendations: Omit<Recommendation, 'recommendId' | 'createdAt'>[] = [];

    // Example recommendation generation logic
    const age = child.birthYear ? new Date().getFullYear() - child.birthYear : null;
    
    if (age && age >= 6 && age <= 10) {
      recommendations.push({
        familyUid,
        targetMemberId: childMemberId,
        kind: 'book',
        title: 'ふしぎの国のアリス',
        reason: `${child.displayName}さんの年齢（${age}歳）に適した想像力を育む本です`
      });

      recommendations.push({
        familyUid,
        targetMemberId: childMemberId,
        kind: 'place',
        title: '科学館',
        reason: '観察や比較の学習に役立つ体験型の学習場所です'
      });
    }

    if (age && age >= 8) {
      recommendations.push({
        familyUid,
        targetMemberId: childMemberId,
        kind: 'question',
        title: 'なぜ空は青いの？',
        reason: '自然現象への興味を引き出し、仮説を立てる練習になります'
      });
    }

    // Save generated recommendations
    const savedRecommendations: Recommendation[] = [];
    for (const rec of recommendations) {
      const savedRec = await this.createRecommendation(rec);
      savedRecommendations.push(savedRec);
    }

    return savedRecommendations;
  }

  // Analytics methods
  async getRecommendationStatsByTarget(familyUid: string, targetMemberId: string): Promise<{
    total: number;
    byKind: {
      question: number;
      book: number;
      place: number;
    };
  }> {
    const recommendations = await this.getRecommendationsByTarget(familyUid, targetMemberId);
    
    const byKind = {
      question: recommendations.filter(r => r.kind === 'question').length,
      book: recommendations.filter(r => r.kind === 'book').length,
      place: recommendations.filter(r => r.kind === 'place').length,
    };

    return {
      total: recommendations.length,
      byKind
    };
  }

  async getRecentRecommendations(familyUid: string, limit: number = 10): Promise<Recommendation[]> {
    const allRecommendations = await this.recommendationRepository.findAll(familyUid);
    return allRecommendations
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }
}