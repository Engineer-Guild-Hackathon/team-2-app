import {
  RecommendationPort,
  LocationPort,
  CatalogPort,
  AnalyticsPort
} from '../domain/recommendationPorts';
import {
  RecommendQuery,
  Recommendation,
  RecommendationDetail,
  GeoPoint,
  LocationResult,
  PermissionDenied
} from '../types/recommendation';

export class AIRecommendationService {
  constructor(
    private recommendationPort: RecommendationPort,
    private locationPort: LocationPort,
    private catalogPort: CatalogPort,
    private analyticsPort: AnalyticsPort
  ) {}

  async getRecommendations(query: RecommendQuery): Promise<Recommendation[]> {
    try {
      // アナリティクス送信
      await this.analyticsPort.track('search_recommendations', {
        mode: query.mode,
        categories: query.categories,
        radiusKm: query.radiusKm,
        hasLocation: !!query.coords,
        filters: {
          freeOnly: query.freeOnly,
          openNow: query.openNow,
          age: query.age
        }
      });

      const recommendations = await this.recommendationPort.getRecommendations(query);

      // 成功時のアナリティクス
      await this.analyticsPort.track('recommendations_received', {
        count: recommendations.length,
        query: query
      });

      return recommendations;
    } catch (error) {
      // エラー時のアナリティクス
      await this.analyticsPort.track('recommendations_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query
      });
      throw error;
    }
  }

  async getRecommendationDetail(id: string): Promise<RecommendationDetail> {
    try {
      // アナリティクス送信
      await this.analyticsPort.track('view_recommendation_detail', {
        recommendationId: id
      });

      return await this.recommendationPort.getItemDetail(id);
    } catch (error) {
      await this.analyticsPort.track('recommendation_detail_error', {
        recommendationId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async getUserLocation(): Promise<LocationResult | PermissionDenied> {
    try {
      // アナリティクス送信
      await this.analyticsPort.track('request_location', {});

      const result = await this.locationPort.getUserLocation();

      if ('type' in result) {
        // 位置情報拒否時のアナリティクス
        await this.analyticsPort.track('location_permission_denied', {
          reason: result.message
        });
      } else {
        // 位置情報取得成功時のアナリティクス
        await this.analyticsPort.track('location_permission_granted', {});
      }

      return result;
    } catch (error) {
      await this.analyticsPort.track('location_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async checkLocationPermission(): Promise<boolean> {
    try {
      return await this.locationPort.requestLocationPermission();
    } catch (error) {
      console.warn('Failed to check location permission:', error);
      return false;
    }
  }

  createQuery({
    mode = 'learner',
    coords,
    radiusKm = 5,
    categories,
    age,
    interests,
    openNow = false,
    freeOnly = false,
    limit = 10
  }: Partial<RecommendQuery>): RecommendQuery {
    return {
      mode,
      coords,
      radiusKm,
      categories,
      age,
      interests,
      openNow,
      freeOnly,
      limit
    };
  }

  // カテゴリ別のおすすめを取得
  async getRecommendationsByCategory(
    category: string,
    coords?: GeoPoint,
    mode: 'learner' | 'family' = 'learner'
  ): Promise<Recommendation[]> {
    const query = this.createQuery({
      mode,
      coords,
      categories: [category as any],
      limit: 6
    });

    return this.getRecommendations(query);
  }

  // 今日のおすすめを取得
  async getTodaysRecommendations(
    coords?: GeoPoint,
    mode: 'learner' | 'family' = 'learner'
  ): Promise<Recommendation[]> {
    const query = this.createQuery({
      mode,
      coords,
      radiusKm: 3,
      openNow: true,
      limit: 3
    });

    return this.getRecommendations(query);
  }

  // 近くのおすすめを取得
  async getNearbyRecommendations(
    coords: GeoPoint,
    mode: 'learner' | 'family' = 'learner'
  ): Promise<Recommendation[]> {
    const query = this.createQuery({
      mode,
      coords,
      radiusKm: 2,
      limit: 6
    });

    return this.getRecommendations(query);
  }
}