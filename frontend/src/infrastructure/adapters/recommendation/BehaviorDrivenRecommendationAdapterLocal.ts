import {
  BehaviorDrivenRecommendationPort,
  Candidate,
  RankedRecommendation,
  RecoContext,
  InferredProfile,
  RecommendationCategory
} from '../../../types/recommendation';

interface CandidateScore {
  candidate: Candidate;
  relevance: number;
  travel: number;
  cost: number;
  weatherFit: number;
  quietSafety: number;
  novelty: number;
  totalScore: number;
  why: string[];
}

export class BehaviorDrivenRecommendationAdapterLocal implements BehaviorDrivenRecommendationPort {
  private readonly EPSILON_GREEDY = 0.1; // 探索率
  private readonly EPSILON_COLD_START = 0.25; // コールドスタート時の探索率
  private readonly MMR_LAMBDA = 0.7; // 多様性バランス（0.7 = 関連性重視、0.3 = 多様性）
  private readonly MAX_SAME_CATEGORY = 2; // 同カテゴリ連続制限

  // スコア重み設定
  private readonly SCORE_WEIGHTS = {
    relevance: 0.45,
    travel: 0.2,
    cost: 0.15,
    weatherFit: 0.1,
    quietSafety: 0.1
  };

  async rank(
    candidates: Candidate[],
    context: RecoContext,
    profile?: InferredProfile
  ): Promise<RankedRecommendation[]> {
    if (candidates.length === 0) {
      return [];
    }

    // プロファイルがない場合はデフォルトプロファイルを使用
    const effectiveProfile = profile || this.getDefaultProfile(context);

    // 1. 基本スコア計算
    const scoredCandidates = candidates.map(candidate =>
      this.calculateCandidateScore(candidate, context, effectiveProfile)
    );

    // 2. epsilon-greedy による探索
    const epsilon = effectiveProfile.confidence < 0.3 ? this.EPSILON_COLD_START : this.EPSILON_GREEDY;
    const explorationCandidates = this.applyEpsilonGreedy(scoredCandidates, epsilon);

    // 3. MMR による多様化
    const diversifiedCandidates = this.applyMMR(explorationCandidates, this.MMR_LAMBDA);

    // 4. 同カテゴリ連続制限
    const finalCandidates = this.limitSameCategory(diversifiedCandidates, this.MAX_SAME_CATEGORY);

    // 5. RankedRecommendation に変換
    return finalCandidates.map((scored, index) => ({
      ...scored.candidate,
      score: scored.totalScore,
      why: scored.why,
      badges: this.generateBadges(scored, context, effectiveProfile)
    }));
  }

  private calculateCandidateScore(
    candidate: Candidate,
    context: RecoContext,
    profile: InferredProfile
  ): CandidateScore {
    const relevance = this.calculateRelevance(candidate, profile);
    const travel = this.calculateTravelScore(candidate, context, profile);
    const cost = this.calculateCostScore(candidate, profile);
    const weatherFit = this.calculateWeatherFit(candidate, context);
    const quietSafety = this.calculateQuietSafety(candidate, profile, context);
    const novelty = this.calculateNovelty(candidate);

    const totalScore =
      relevance * this.SCORE_WEIGHTS.relevance +
      travel * this.SCORE_WEIGHTS.travel +
      cost * this.SCORE_WEIGHTS.cost +
      weatherFit * this.SCORE_WEIGHTS.weatherFit +
      quietSafety * this.SCORE_WEIGHTS.quietSafety;

    const why = this.generateWhy(candidate, context, profile, {
      relevance, travel, cost, weatherFit, quietSafety
    });

    return {
      candidate,
      relevance,
      travel,
      cost,
      weatherFit,
      quietSafety,
      novelty,
      totalScore,
      why
    };
  }

  private calculateRelevance(candidate: Candidate, profile: InferredProfile): number {
    // カテゴリ重みによる基本スコア
    let categoryScore = profile.categoryWeights[candidate.category] || 0.1;

    // 興味重みによる加算
    let interestScore = 0;
    candidate.tags.forEach(tag => {
      interestScore += profile.interestWeights[tag] || 0;
    });

    // 正規化（最大1.0）
    return Math.min(1.0, categoryScore + interestScore * 0.5);
  }

  private calculateTravelScore(
    candidate: Candidate,
    context: RecoContext,
    profile: InferredProfile
  ): number {
    if (!candidate.distanceKm) {
      return 0.7; // 距離不明の場合は中程度のスコア
    }

    // 許容距離に対する比率（近いほど高スコア）
    const distanceRatio = candidate.distanceKm / profile.distanceKmTolerance;

    if (distanceRatio <= 1.0) {
      return 1.0 - (distanceRatio * 0.3); // 許容内は高スコア
    } else {
      return Math.max(0.1, 0.7 - (distanceRatio - 1.0) * 0.5); // 許容外は減点
    }
  }

  private calculateCostScore(candidate: Candidate, profile: InferredProfile): number {
    if (!candidate.price) {
      return 0.8; // 価格不明は中高スコア
    }

    const price = candidate.price.toLowerCase();
    const isFree = price.includes('無料') || price.includes('free') || price === '0';

    switch (profile.costPreference) {
      case 'free':
        return isFree ? 1.0 : 0.2;
      case 'low':
        if (isFree) return 1.0;
        return price.includes('安') || price.includes('低料金') ? 0.8 : 0.5;
      case 'any':
        return isFree ? 1.0 : 0.7;
      default:
        return 0.5;
    }
  }

  private calculateWeatherFit(candidate: Candidate, context: RecoContext): number {
    if (!context.weather) {
      return 0.8; // 天気不明は中高スコア
    }

    const isRainy = context.weather.includes('rain') || context.weather.includes('雨');

    if (isRainy) {
      return candidate.indoor ? 1.0 : 0.3; // 雨の場合は屋内優先
    } else {
      return candidate.indoor ? 0.7 : 1.0; // 晴れの場合は屋外優先
    }
  }

  private calculateQuietSafety(
    candidate: Candidate,
    profile: InferredProfile,
    context: RecoContext
  ): number {
    let score = 0.5; // 基本スコア

    // 静けさ要求との適合
    if (profile.quietNeeded && candidate.quiet) {
      score += 0.3;
    } else if (!profile.quietNeeded && !candidate.quiet) {
      score += 0.1;
    }

    // 子どもモードの場合の安全性考慮
    if (context.mode === 'learner') {
      if (candidate.accessibility.includes('車椅子対応') ||
          candidate.accessibility.includes('バリアフリー')) {
        score += 0.2;
      }
    }

    return Math.min(1.0, score);
  }

  private calculateNovelty(candidate: Candidate): number {
    // 簡易実装：新しいアイテムや人気度が低いアイテムを優遇
    // 実際の実装では過去の表示履歴を参照
    return 0.5 + Math.random() * 0.3; // 0.5-0.8の範囲
  }

  private generateWhy(
    candidate: Candidate,
    context: RecoContext,
    profile: InferredProfile,
    scores: {
      relevance: number;
      travel: number;
      cost: number;
      weatherFit: number;
      quietSafety: number;
    }
  ): string[] {
    const why: string[] = [];

    // 距離に関する理由
    if (scores.travel > 0.8 && candidate.distanceKm) {
      if (candidate.distanceKm <= 1.0) {
        why.push('徒歩圏内');
      } else if (candidate.distanceKm <= 3.0) {
        why.push(`${candidate.distanceKm.toFixed(1)}km`);
      }
    }

    // 料金に関する理由
    if (scores.cost > 0.8) {
      if (candidate.price?.includes('無料') || candidate.price?.includes('free')) {
        why.push('無料');
      } else if (profile.costPreference !== 'any') {
        why.push('お手頃');
      }
    }

    // 天気に関する理由
    if (scores.weatherFit > 0.8) {
      if (context.weather?.includes('rain') && candidate.indoor) {
        why.push('雨OK');
      } else if (!context.weather?.includes('rain') && !candidate.indoor) {
        why.push('屋外活動');
      }
    }

    // 興味に関する理由
    if (scores.relevance > 0.7) {
      const matchingTags = candidate.tags.filter(tag =>
        profile.interestWeights[tag] && profile.interestWeights[tag] > 0.3
      );
      if (matchingTags.length > 0) {
        why.push(matchingTags[0]); // 最初のタグを表示
      }
    }

    // 時間に関する理由
    if (context.hour >= 9 && context.hour <= 11) {
      why.push('午前中おすすめ');
    } else if (context.hour >= 14 && context.hour <= 16) {
      why.push('午後の時間に最適');
    }

    // 最大3つまでに制限
    return why.slice(0, 3);
  }

  private generateBadges(
    scored: CandidateScore,
    context: RecoContext,
    profile: InferredProfile
  ): string[] {
    const badges: string[] = [];

    if (scored.relevance > 0.8) badges.push('おすすめ');
    if (scored.travel > 0.9) badges.push('近い');
    if (scored.cost > 0.9) badges.push('お得');
    if (scored.weatherFit > 0.9) badges.push('天気◎');
    if (scored.candidate.accessibility.length > 0) badges.push('アクセシブル');

    return badges;
  }

  private applyEpsilonGreedy(candidates: CandidateScore[], epsilon: number): CandidateScore[] {
    const shouldExplore = Math.random() < epsilon;

    if (shouldExplore && candidates.length > 5) {
      // 探索：ランダムに並び替え
      return candidates.sort(() => Math.random() - 0.5);
    } else {
      // 活用：スコア順に並べ替え
      return candidates.sort((a, b) => b.totalScore - a.totalScore);
    }
  }

  private applyMMR(candidates: CandidateScore[], lambda: number): CandidateScore[] {
    if (candidates.length <= 1) return candidates;

    const selected: CandidateScore[] = [];
    const remaining = [...candidates];

    // 最初は最高スコアを選択
    const firstCandidate = remaining.reduce((best, current) =>
      current.totalScore > best.totalScore ? current : best
    );
    selected.push(firstCandidate);
    remaining.splice(remaining.indexOf(firstCandidate), 1);

    // MMRでバランスを取りながら選択
    while (remaining.length > 0 && selected.length < Math.min(10, candidates.length)) {
      let bestCandidate: CandidateScore | null = null;
      let bestMMRScore = -1;

      for (const candidate of remaining) {
        // 関連性スコア
        const relevanceScore = candidate.totalScore;

        // 多様性スコア（既選択アイテムとの類似度を計算）
        const diversityScore = this.calculateDiversityScore(candidate, selected);

        // MMRスコア
        const mmrScore = lambda * relevanceScore + (1 - lambda) * diversityScore;

        if (mmrScore > bestMMRScore) {
          bestMMRScore = mmrScore;
          bestCandidate = candidate;
        }
      }

      if (bestCandidate) {
        selected.push(bestCandidate);
        remaining.splice(remaining.indexOf(bestCandidate), 1);
      } else {
        break;
      }
    }

    return selected;
  }

  private calculateDiversityScore(candidate: CandidateScore, selected: CandidateScore[]): number {
    if (selected.length === 0) return 1.0;

    // カテゴリの多様性
    const sameCategory = selected.filter(s => s.candidate.category === candidate.candidate.category).length;
    const categoryDiversity = Math.max(0, 1.0 - sameCategory * 0.3);

    // タグの多様性
    const candidateTags = new Set(candidate.candidate.tags);
    const selectedTags = new Set(selected.flatMap(s => s.candidate.tags));
    const intersection = [...candidateTags].filter(tag => selectedTags.has(tag)).length;
    const tagDiversity = Math.max(0, 1.0 - intersection * 0.2);

    return (categoryDiversity + tagDiversity) / 2;
  }

  private limitSameCategory(candidates: CandidateScore[], maxSame: number): CandidateScore[] {
    const result: CandidateScore[] = [];
    const categoryCounts: Record<RecommendationCategory, number> = {
      park: 0,
      museum: 0,
      library: 0,
      book: 0,
      event: 0
    };

    for (const candidate of candidates) {
      const category = candidate.candidate.category;
      if (categoryCounts[category] < maxSame) {
        result.push(candidate);
        categoryCounts[category]++;
      }
    }

    return result;
  }

  private getDefaultProfile(context: RecoContext): InferredProfile {
    return {
      interestWeights: {
        '学習': 0.3,
        '体験': 0.3,
        '自然': 0.2,
        '文化': 0.2
      },
      categoryWeights: {
        park: 0.25,
        museum: 0.2,
        library: 0.2,
        book: 0.175,
        event: 0.175
      },
      costPreference: 'free',
      indoorPreference: context.weather?.includes('rain') || false,
      quietNeeded: false,
      distanceKmTolerance: 5.0,
      timeWindow: `today ${context.hour}:00-18:00`,
      mode: context.mode,
      confidence: 0.1
    };
  }
}