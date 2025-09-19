import { MLPort, SessionSignal, InferredProfile, RecommendationMode, RecommendationCategory } from '../../../types/recommendation';

export class MLAdapterLocal implements MLPort {
  private readonly HALF_LIFE_DAYS = 7; // 半減期7日
  private readonly MIN_CONFIDENCE = 0.1;
  private readonly COLD_START_THRESHOLD = 5; // 5回未満はコールドスタート

  async inferProfile(signals: SessionSignal[]): Promise<InferredProfile> {
    if (signals.length < this.COLD_START_THRESHOLD) {
      return this.getColdStartProfile(signals);
    }

    const interestWeights = this.calculateInterestWeights(signals);
    const categoryWeights = this.calculateCategoryWeights(signals);
    const costPreference = this.inferCostPreference(signals);
    const indoorPreference = this.inferIndoorPreference(signals);
    const quietNeeded = this.inferQuietPreference(signals);
    const distanceKmTolerance = this.inferDistanceTolerance(signals);
    const mode = this.inferMode(signals);
    const timeWindow = this.inferTimeWindow(signals);
    const confidence = this.calculateConfidence(signals);

    return {
      interestWeights,
      categoryWeights,
      costPreference,
      indoorPreference,
      quietNeeded,
      distanceKmTolerance,
      timeWindow,
      mode,
      confidence
    };
  }

  async updateProfile(profile: InferredProfile, newSignal: SessionSignal): Promise<InferredProfile> {
    // 新しいシグナルを含む配列を作成
    const signals = [newSignal];
    const newProfile = await this.inferProfile(signals);

    // 既存プロファイルと新しい推論を重み付け統合
    const alpha = 0.3; // 新しい情報の重み

    return {
      interestWeights: this.mergeWeights(profile.interestWeights, newProfile.interestWeights, alpha),
      categoryWeights: this.mergeCategoryWeights(profile.categoryWeights, newProfile.categoryWeights, alpha),
      costPreference: newProfile.costPreference, // 最新を優先
      indoorPreference: profile.indoorPreference, // 既存を維持（急激な変化を避ける）
      quietNeeded: profile.quietNeeded,
      distanceKmTolerance: profile.distanceKmTolerance * (1 - alpha) + newProfile.distanceKmTolerance * alpha,
      timeWindow: newProfile.timeWindow,
      mode: newProfile.mode,
      confidence: Math.min(1.0, profile.confidence + 0.1) // 段階的に信頼度向上
    };
  }

  private getColdStartProfile(signals: SessionSignal[]): InferredProfile {
    const now = new Date();
    const hour = now.getHours();
    const dow = now.getDay();

    // 時間・曜日バイアス
    let defaultMode: RecommendationMode = 'learner';
    let defaultIndoor = false;
    let defaultDistance = 5.0; // 5km

    // 平日夕方 = 短時間・屋内
    if (dow >= 1 && dow <= 5 && hour >= 17) {
      defaultIndoor = true;
      defaultDistance = 3.0;
    }

    // 休日午前 = 屋外・長距離OK
    if ((dow === 0 || dow === 6) && hour >= 9 && hour <= 11) {
      defaultIndoor = false;
      defaultDistance = 10.0;
      defaultMode = 'family';
    }

    // シグナルから最低限の情報を抽出
    const hasKidSafeInteraction = signals.some(s => s.event.name === 'kid_safe_interaction');
    if (hasKidSafeInteraction) {
      defaultMode = 'learner';
    }

    return {
      interestWeights: {
        '動物': 0.3,
        '自然': 0.3,
        '学習': 0.2,
        '体験': 0.2
      },
      categoryWeights: {
        park: 0.3,
        museum: 0.2,
        library: 0.2,
        book: 0.15,
        event: 0.15
      },
      costPreference: 'free',
      indoorPreference: defaultIndoor,
      quietNeeded: false,
      distanceKmTolerance: defaultDistance,
      timeWindow: this.formatTimeWindow(hour),
      mode: defaultMode,
      confidence: this.MIN_CONFIDENCE
    };
  }

  private calculateInterestWeights(signals: SessionSignal[]): Record<string, number> {
    const weights: Record<string, number> = {};
    const now = Date.now();

    signals.forEach(signal => {
      if (signal.event.name === 'view_item') {
        const payload = signal.event.payload;
        const timestamp = new Date(signal.event.ts).getTime();
        const ageInDays = (now - timestamp) / (1000 * 60 * 60 * 24);

        // 半減期による減衰
        const decay = Math.pow(0.5, ageInDays / this.HALF_LIFE_DAYS);

        // 滞在時間による重み付け
        const dwellWeight = Math.min(1.0, (payload.dwell_ms || 1000) / 30000); // 30秒で最大重み

        // スクロール深度による重み付け
        const scrollWeight = Math.min(1.0, (payload.scroll_depth || 0.1) / 0.8); // 80%で最大重み

        const totalWeight = decay * dwellWeight * scrollWeight;

        // タグから興味を抽出（簡易実装）
        const tags = payload.tags || [];
        tags.forEach((tag: string) => {
          weights[tag] = (weights[tag] || 0) + totalWeight;
        });
      }
    });

    // 正規化
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (total > 0) {
      Object.keys(weights).forEach(key => {
        weights[key] /= total;
      });
    }

    return weights;
  }

  private calculateCategoryWeights(signals: SessionSignal[]): Record<RecommendationCategory, number> {
    const weights: Record<RecommendationCategory, number> = {
      park: 0,
      museum: 0,
      library: 0,
      book: 0,
      event: 0
    };

    const categoryCounts: Record<RecommendationCategory, number> = {
      park: 0,
      museum: 0,
      library: 0,
      book: 0,
      event: 0
    };

    signals.forEach(signal => {
      if (signal.event.name === 'view_item' || signal.event.name === 'content_theme') {
        const category = signal.event.payload.category;
        if (category && category in weights) {
          categoryCounts[category as RecommendationCategory]++;

          // 滞在時間も考慮
          if (signal.event.name === 'view_item') {
            const dwellMs = signal.event.payload.dwell_ms || 1000;
            weights[category as RecommendationCategory] += dwellMs / 1000;
          } else {
            weights[category as RecommendationCategory] += 1;
          }
        }
      }
    });

    // 正規化
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (total > 0) {
      Object.keys(weights).forEach(key => {
        weights[key as RecommendationCategory] /= total;
      });
    } else {
      // デフォルト重み
      weights.park = 0.3;
      weights.museum = 0.2;
      weights.library = 0.2;
      weights.book = 0.15;
      weights.event = 0.15;
    }

    return weights;
  }

  private inferCostPreference(signals: SessionSignal[]): 'free' | 'low' | 'any' {
    let freeCount = 0;
    let paidCount = 0;

    signals.forEach(signal => {
      if (signal.event.name === 'filter_apply') {
        if (signal.event.payload.free_only) {
          freeCount++;
        }
      }
      if (signal.event.name === 'view_item') {
        const price = signal.event.payload.price;
        if (price === '無料' || price === 'free') {
          freeCount++;
        } else if (price && price !== '無料') {
          paidCount++;
        }
      }
    });

    const freeRatio = freeCount / (freeCount + paidCount + 1);

    if (freeRatio > 0.8) return 'free';
    if (freeRatio > 0.5) return 'low';
    return 'any';
  }

  private inferIndoorPreference(signals: SessionSignal[]): boolean {
    let indoorViews = 0;
    let outdoorViews = 0;
    let rainySessions = 0;
    let totalSessions = 0;

    signals.forEach(signal => {
      totalSessions++;

      if (signal.context.weather === 'rain' || signal.context.hour > 18 || signal.context.hour < 8) {
        rainySessions++;
      }

      if (signal.event.name === 'view_item') {
        if (signal.event.payload.indoor === true) {
          indoorViews++;
        } else if (signal.event.payload.indoor === false) {
          outdoorViews++;
        }
      }
    });

    // 雨天/夜間時の屋内詳細閲覧比率
    const rainyRatio = rainySessions / (totalSessions + 1);
    const indoorRatio = indoorViews / (indoorViews + outdoorViews + 1);

    return rainyRatio > 0.3 && indoorRatio > 0.6;
  }

  private inferQuietPreference(signals: SessionSignal[]): boolean {
    let libraryViews = 0;
    let totalViews = 0;
    let avgLibraryDwell = 0;
    let avgOtherDwell = 0;

    signals.forEach(signal => {
      if (signal.event.name === 'view_item') {
        totalViews++;
        const dwell = signal.event.payload.dwell_ms || 1000;

        if (signal.event.payload.category === 'library') {
          libraryViews++;
          avgLibraryDwell += dwell;
        } else {
          avgOtherDwell += dwell;
        }
      }
    });

    if (libraryViews > 0) {
      avgLibraryDwell /= libraryViews;
    }
    if (totalViews - libraryViews > 0) {
      avgOtherDwell /= (totalViews - libraryViews);
    }

    // 図書館系の滞在が長く、比率も高い場合
    return libraryViews / (totalViews + 1) > 0.3 && avgLibraryDwell > avgOtherDwell * 1.5;
  }

  private inferDistanceTolerance(signals: SessionSignal[]): number {
    const distances: number[] = [];

    signals.forEach(signal => {
      if (signal.event.name === 'view_item' && signal.event.payload.distanceKm) {
        distances.push(signal.event.payload.distanceKm);
      }
      if (signal.event.name === 'filter_apply' && signal.event.payload.distance_km) {
        distances.push(signal.event.payload.distance_km);
      }
    });

    if (distances.length === 0) {
      return 5.0; // デフォルト5km
    }

    // 上位80%分位を許容距離とする
    distances.sort((a, b) => a - b);
    const percentile80Index = Math.floor(distances.length * 0.8);
    return distances[percentile80Index] || 5.0;
  }

  private inferMode(signals: SessionSignal[]): RecommendationMode {
    let kidSafeInteractions = 0;
    let parentHintExpansions = 0;

    signals.forEach(signal => {
      if (signal.event.name === 'kid_safe_interaction') {
        kidSafeInteractions++;
      }
      // 親向けヒント展開を検出（仮想的なイベント）
      if (signal.event.payload.parent_hint_expanded) {
        parentHintExpansions++;
      }
    });

    // 子供向け操作が多い場合は learner
    if (kidSafeInteractions > 2) {
      return 'learner';
    }

    // 親向けヒントの利用が多い場合は family
    if (parentHintExpansions > 1) {
      return 'family';
    }

    // デフォルトは学習者モード
    return 'learner';
  }

  private inferTimeWindow(signals: SessionSignal[]): string {
    const now = new Date();
    const currentHour = now.getHours();

    // 現在時刻から推定される利用可能時間
    if (currentHour >= 9 && currentHour <= 11) {
      return `today ${currentHour}:00-17:00`;
    }
    if (currentHour >= 13 && currentHour <= 15) {
      return `today ${currentHour}:00-18:00`;
    }

    return `today ${currentHour}:00-${Math.min(18, currentHour + 4)}:00`;
  }

  private formatTimeWindow(hour: number): string {
    const endHour = Math.min(20, hour + 4);
    return `today ${hour}:00-${endHour}:00`;
  }

  private calculateConfidence(signals: SessionSignal[]): number {
    // シグナル数、時間幅、イベント多様性から信頼度を計算
    const eventTypes = new Set(signals.map(s => s.event.name));
    const timeSpanHours = this.getTimeSpanHours(signals);

    const signalScore = Math.min(1.0, signals.length / 20); // 20個で最大
    const diversityScore = Math.min(1.0, eventTypes.size / 5); // 5種類で最大
    const timeScore = Math.min(1.0, timeSpanHours / 2); // 2時間で最大

    return Math.max(this.MIN_CONFIDENCE, (signalScore + diversityScore + timeScore) / 3);
  }

  private getTimeSpanHours(signals: SessionSignal[]): number {
    if (signals.length < 2) return 0;

    const timestamps = signals.map(s => new Date(s.event.ts).getTime());
    const spanMs = Math.max(...timestamps) - Math.min(...timestamps);
    return spanMs / (1000 * 60 * 60);
  }

  private mergeWeights(
    existing: Record<string, number>,
    newWeights: Record<string, number>,
    alpha: number
  ): Record<string, number> {
    const merged: Record<string, number> = { ...existing };

    Object.keys(newWeights).forEach(key => {
      if (key in merged) {
        merged[key] = merged[key] * (1 - alpha) + newWeights[key] * alpha;
      } else {
        merged[key] = newWeights[key] * alpha;
      }
    });

    return merged;
  }

  private mergeCategoryWeights(
    existing: Record<RecommendationCategory, number>,
    newWeights: Record<RecommendationCategory, number>,
    alpha: number
  ): Record<RecommendationCategory, number> {
    const merged: Record<RecommendationCategory, number> = { ...existing };

    Object.keys(newWeights).forEach(key => {
      const category = key as RecommendationCategory;
      merged[category] = merged[category] * (1 - alpha) + newWeights[category] * alpha;
    });

    return merged;
  }
}