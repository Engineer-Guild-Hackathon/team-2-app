import {
  RecommendationPort,
  LocationPort,
  CatalogPort,
  AnalyticsPort
} from '../../domain/recommendationPorts';
import {
  RecommendQuery,
  Recommendation,
  RecommendationDetail,
  LocationResult,
  PermissionDenied,
  BookQuery,
  Book,
  PlaceQuery,
  Place,
  GeoPoint
} from '../../types/recommendation';
import { mockRecommendations, mockRecommendationDetails } from '../../mocks/recommendationData';

export class MockRecommendationAdapter implements RecommendationPort {
  async getRecommendations(query: RecommendQuery): Promise<Recommendation[]> {
    // 簡単なフィルタリングロジック
    let filtered = [...mockRecommendations];

    if (query.categories && query.categories.length > 0) {
      filtered = filtered.filter(item => {
        if (item.kind === 'place') {
          // place の場合、タグで判定
          return query.categories?.some(cat =>
            item.tags.some(tag => tag.includes(this.categoryToTag(cat)))
          );
        }
        return true;
      });
    }

    if (query.freeOnly) {
      filtered = filtered.filter(item => item.price === 'free');
    }

    if (query.coords && query.radiusKm) {
      filtered = filtered.filter(item => {
        if (item.distanceKm !== undefined) {
          return item.distanceKm <= query.radiusKm;
        }
        return true;
      });
    }

    // 学習者/家庭モードによる調整
    if (query.mode === 'family') {
      filtered = filtered.map(item => ({
        ...item,
        badges: [...item.badges, '家族向け']
      }));
    }

    return filtered.slice(0, query.limit);
  }

  async getItemDetail(id: string): Promise<RecommendationDetail> {
    const detail = mockRecommendationDetails[id];
    if (!detail) {
      throw new Error(`Recommendation detail not found for id: ${id}`);
    }
    return detail;
  }

  private categoryToTag(category: string): string {
    const mapping: Record<string, string> = {
      'park': '公園',
      'museum': '博物館',
      'library': '図書館',
      'book': '本',
      'event': 'イベント'
    };
    return mapping[category] || category;
  }
}

export class MockLocationAdapter implements LocationPort {
  async getUserLocation(): Promise<LocationResult | PermissionDenied> {
    // モックでは東京駅周辺の座標を返す
    await this.delay(1000); // リアルな遅延をシミュレート

    if (Math.random() > 0.8) {
      return {
        type: 'permission_denied',
        message: 'ユーザーが位置情報の共有を拒否しました'
      };
    }

    return {
      coords: {
        lat: 35.6812 + (Math.random() - 0.5) * 0.01,
        lng: 139.7671 + (Math.random() - 0.5) * 0.01
      }
    };
  }

  async getCurrentPosition(): Promise<LocationResult> {
    await this.delay(800);
    return {
      coords: {
        lat: 35.6812,
        lng: 139.7671
      }
    };
  }

  async requestLocationPermission(): Promise<boolean> {
    await this.delay(500);
    return Math.random() > 0.3; // 70%の確率で許可
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class MockCatalogAdapter implements CatalogPort {
  private mockBooks: Book[] = [
    {
      id: 'book-003',
      title: 'どうぶつの親子',
      author: '薮内正幸',
      thumbnail: '/images/animal-parents.jpg',
      description: 'リアルな動物のイラストで親子の愛情を描いた絵本',
      category: '動物',
      ageRange: '2-5歳'
    },
    {
      id: 'book-004',
      title: '季節を感じる植物図鑑',
      author: '高橋進',
      thumbnail: '/images/plant-guide.jpg',
      description: '公園で見つけられる植物を季節ごとに紹介',
      category: '自然・科学',
      ageRange: '5-10歳'
    }
  ];

  private mockPlaces: Place[] = [
    {
      id: 'place-001',
      name: '上野動物園',
      category: 'park',
      location: {
        lat: 35.7156,
        lng: 139.7717,
        address: '東京都台東区上野公園9-83'
      },
      openHours: '9:30-17:00',
      price: '¥600',
      accessibility: ['ベビーカー可', '車椅子可']
    }
  ];

  async searchBooks(query: BookQuery): Promise<Book[]> {
    await this.delay(500);
    let results = [...this.mockBooks];

    if (query.query) {
      results = results.filter(book =>
        book.title.includes(query.query) ||
        book.author.includes(query.query) ||
        book.description?.includes(query.query)
      );
    }

    if (query.category) {
      results = results.filter(book => book.category === query.category);
    }

    return results.slice(0, query.limit || 10);
  }

  async searchPlaces(query: PlaceQuery): Promise<Place[]> {
    await this.delay(600);
    let results = [...this.mockPlaces];

    if (query.category) {
      results = results.filter(place => place.category === query.category);
    }

    if (query.freeOnly) {
      results = results.filter(place => place.price === 'free');
    }

    return results.slice(0, query.limit || 10);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class MockAnalyticsAdapter implements AnalyticsPort {
  async track(eventName: string, payload: Record<string, any>): Promise<void> {
    // 開発環境ではコンソールに出力
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', eventName, payload);
    }

    // 実際の送信はここでは行わない（モック）
    await this.delay(100);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}