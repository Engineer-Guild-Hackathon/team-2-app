import {
  RecommendationPort,
  LocationPort,
  CatalogPort,
  AnalyticsPort,
  ConfigPort
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
  Place
} from '../../types/recommendation';

export class HttpRecommendationAdapter implements RecommendationPort {
  constructor(private config: ConfigPort) {}

  async getRecommendations(query: RecommendQuery): Promise<Recommendation[]> {
    const url = `${this.config.getApiBaseUrl()}/recommendations`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    return response.json();
  }

  async getItemDetail(id: string): Promise<RecommendationDetail> {
    const url = `${this.config.getApiBaseUrl()}/recommendations/${id}`;
    const headers = this.getHeaders();

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch recommendation detail: ${response.statusText}`);
    }

    return response.json();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const apiKey = this.config.getApiKey();
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return headers;
  }
}

export class BrowserLocationAdapter implements LocationPort {
  async getUserLocation(): Promise<LocationResult | PermissionDenied> {
    if (!navigator.geolocation) {
      return {
        type: 'permission_denied',
        message: 'このブラウザは位置情報サービスに対応していません'
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
        },
        (error) => {
          resolve({
            type: 'permission_denied',
            message: this.getLocationErrorMessage(error.code)
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5分
        }
      );
    });
  }

  async getCurrentPosition(): Promise<LocationResult> {
    const result = await this.getUserLocation();
    if ('type' in result) {
      throw new Error(result.message);
    }
    return result;
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted';
    } catch {
      // permissions API が使えない場合は、実際に位置情報を取得してみる
      const location = await this.getUserLocation();
      return !('type' in location);
    }
  }

  private getLocationErrorMessage(code: number): string {
    switch (code) {
      case 1:
        return 'ユーザーが位置情報の共有を拒否しました';
      case 2:
        return '位置情報を取得できませんでした';
      case 3:
        return '位置情報の取得がタイムアウトしました';
      default:
        return '位置情報の取得中にエラーが発生しました';
    }
  }
}

export class HttpCatalogAdapter implements CatalogPort {
  constructor(private config: ConfigPort) {}

  async searchBooks(query: BookQuery): Promise<Book[]> {
    const url = `${this.config.getApiBaseUrl()}/catalog/books`;
    const headers = this.getHeaders();

    const params = new URLSearchParams();
    params.append('q', query.query);
    if (query.category) params.append('category', query.category);
    if (query.ageRange) params.append('age_range', query.ageRange);
    if (query.limit) params.append('limit', query.limit.toString());

    const response = await fetch(`${url}?${params}`, { headers });

    if (!response.ok) {
      throw new Error(`Failed to search books: ${response.statusText}`);
    }

    return response.json();
  }

  async searchPlaces(query: PlaceQuery): Promise<Place[]> {
    const url = `${this.config.getApiBaseUrl()}/catalog/places`;
    const headers = this.getHeaders();

    const body: any = {};
    if (query.coords) body.coords = query.coords;
    if (query.category) body.category = query.category;
    if (query.radiusKm) body.radiusKm = query.radiusKm;
    if (query.openNow !== undefined) body.openNow = query.openNow;
    if (query.freeOnly !== undefined) body.freeOnly = query.freeOnly;
    if (query.limit) body.limit = query.limit;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to search places: ${response.statusText}`);
    }

    return response.json();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const apiKey = this.config.getApiKey();
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return headers;
  }
}

export class HttpAnalyticsAdapter implements AnalyticsPort {
  constructor(private config: ConfigPort) {}

  async track(eventName: string, payload: Record<string, any>): Promise<void> {
    // フィーチャーフラグでアナリティクスが無効な場合は何もしない
    if (!this.config.getFeatureFlags().enableAnalytics) {
      return;
    }

    const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    if (!analyticsEndpoint) {
      console.warn('Analytics endpoint not configured');
      return;
    }

    try {
      const response = await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_ANALYTICS_KEY || ''}`
        },
        body: JSON.stringify({
          event: eventName,
          timestamp: new Date().toISOString(),
          payload,
          session_id: this.getSessionId()
        })
      });

      if (!response.ok) {
        console.warn('Failed to send analytics event:', response.statusText);
      }
    } catch (error) {
      console.warn('Analytics error:', error);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
}