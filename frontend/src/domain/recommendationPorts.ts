import {
  RecommendQuery,
  Recommendation,
  RecommendationDetail,
  GeoPoint,
  PermissionDenied,
  LocationResult,
  BookQuery,
  Book,
  PlaceQuery,
  Place,
  AnalyticsEvent
} from '../types/recommendation';

// 行動ログ駆動レコメンド用Portsを再エクスポート
export {
  TelemetryPort,
  MLPort,
  BehaviorDrivenRecommendationPort,
  CatalogPort as BehaviorCatalogPort
} from '../types/recommendation';

export interface RecommendationPort {
  getRecommendations(query: RecommendQuery): Promise<Recommendation[]>;
  getItemDetail(id: string): Promise<RecommendationDetail>;
}

export interface LocationPort {
  getUserLocation(): Promise<LocationResult | PermissionDenied>;
  getCurrentPosition(): Promise<LocationResult>;
  requestLocationPermission(): Promise<boolean>;
}

export interface CatalogPort {
  searchBooks(query: BookQuery): Promise<Book[]>;
  searchPlaces(query: PlaceQuery): Promise<Place[]>;
}

export interface AnalyticsPort {
  track(eventName: string, payload: Record<string, any>): Promise<void>;
}

export interface ConfigPort {
  getFeatureFlags(): Record<string, boolean>;
  getApiBaseUrl(): string;
  getApiKey(): string;
  getMapTileUrl(): string;
}