export type RecommendationMode = 'learner' | 'family';

export type RecommendationCategory = 'park' | 'museum' | 'library' | 'event' | 'book';

export type RecommendationKind = 'place' | 'book' | 'event';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RecommendQuery {
  mode: RecommendationMode;
  coords?: GeoPoint;
  radiusKm: number;
  categories?: RecommendationCategory[];
  age?: number;
  interests?: string[];
  openNow?: boolean;
  freeOnly?: boolean;
  limit: number;
}

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  distanceKm?: number;
  tags: string[];
  score: number;
  accessibility: string[];
  price?: string;
  openHours?: string;
  badges: string[];
}

export interface RecommendationLocation {
  lat: number;
  lng: number;
  address: string;
  access?: string;
}

export interface RecommendationLink {
  label: string;
  url: string;
}

export interface RecommendationDetail {
  id: string;
  kind: RecommendationKind;
  title: string;
  description: string;
  gallery: string[];
  location?: RecommendationLocation;
  links: RecommendationLink[];
  suggestedActivities: string[];
  relatedBooks: string[];
  relatedPlaces: string[];
  openingCalendar: string[];
}

export interface BookQuery {
  query: string;
  category?: string;
  ageRange?: string;
  limit?: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  thumbnail?: string;
  description?: string;
  category: string;
  ageRange: string;
}

export interface PlaceQuery {
  coords?: GeoPoint;
  category?: RecommendationCategory;
  radiusKm?: number;
  openNow?: boolean;
  freeOnly?: boolean;
  limit?: number;
}

export interface Place {
  id: string;
  name: string;
  category: RecommendationCategory;
  location: RecommendationLocation;
  openHours?: string;
  price?: string;
  accessibility: string[];
}

export type PermissionDenied = {
  type: 'permission_denied';
  message: string;
};

export interface LocationResult {
  coords: GeoPoint;
}

export interface AnalyticsEvent {
  eventName: string;
  payload: Record<string, any>;
}

export interface FilterOptions {
  categories: RecommendationCategory[];
  priceRange: {
    free?: boolean;
    paid?: boolean;
  };
  accessibility: string[];
  radius: number;
  openNow: boolean;
  ageRange: {
    min?: number;
    max?: number;
  };
  tags: string[];
}

export interface FilterState {
  isOpen: boolean;
  options: FilterOptions;
  appliedFilters: FilterOptions;
}

// === 行動ログ駆動レコメンド ===

export interface TelemetryEvent {
  name: 'view_item' | 'click_cta' | 'toggle_view' | 'filter_apply' | 'pan_map' | 'time_context' | 'location_context' | 'content_theme' | 'kid_safe_interaction';
  ts: string; // ISO timestamp
  payload: Record<string, any>;
}

export interface ViewItemPayload {
  id: string;
  kind: RecommendationKind;
  dwell_ms: number;
  scroll_depth: number;
}

export interface ClickCtaPayload {
  action: 'open_map' | 'navigate' | 'call' | 'reserve' | 'library_hold';
  item_id: string;
}

export interface FilterApplyPayload {
  free_only?: boolean;
  open_now?: boolean;
  indoor?: boolean;
  distance_km?: number;
}

export interface PanMapPayload {
  bbox: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom: number;
  pans: number;
}

export interface SessionSignal {
  event: TelemetryEvent;
  context: {
    weather?: string;
    hour: number;
    dow: number; // 0=Sunday
    holiday?: boolean;
    location?: GeoPoint;
  };
}

export interface InferredProfile {
  interestWeights: Record<string, number>; // e.g., {"昆虫":0.8,"恐竜":0.6}
  categoryWeights: Record<RecommendationCategory, number>;
  costPreference: 'free' | 'low' | 'any';
  indoorPreference: boolean;
  quietNeeded: boolean;
  distanceKmTolerance: number;
  timeWindow: string; // e.g., "today 13:00-17:00"
  mode: RecommendationMode;
  confidence: number; // 0-1, 推論の信頼度
}

export interface Candidate {
  id: string;
  kind: RecommendationKind;
  title: string;
  subtitle?: string;
  category: RecommendationCategory;
  location?: RecommendationLocation;
  price?: string;
  indoor: boolean;
  quiet: boolean;
  distanceKm?: number;
  tags: string[];
  accessibility: string[];
  openHours?: string;
  thumbnail?: string;
}

export interface RecoContext {
  weather?: string;
  hour: number;
  dow: number;
  holiday?: boolean;
  origin?: GeoPoint;
  mode: RecommendationMode;
  featureFlags: Record<string, boolean>;
}

export interface RankedRecommendation extends Candidate {
  score: number;
  why: string[]; // 最大3点の理由
  badges: string[];
}

export interface EventQuery {
  coords?: GeoPoint;
  category?: RecommendationCategory;
  radiusKm?: number;
  openNow?: boolean;
  freeOnly?: boolean;
  startDate?: string; // ISO date
  endDate?: string;
  limit?: number;
}

export interface Event {
  id: string;
  title: string;
  category: RecommendationCategory;
  location: RecommendationLocation;
  startTime: string;
  endTime: string;
  price?: string;
  indoor: boolean;
  accessibility: string[];
  ageRange?: {
    min: number;
    max: number;
  };
}

// === Ports (抽象インターフェース) ===

export interface TelemetryPort {
  capture(event: TelemetryEvent): void;
  getSessionSignals(): Promise<SessionSignal[]>;
  clearSession(): void;
}

export interface MLPort {
  inferProfile(signals: SessionSignal[]): Promise<InferredProfile>;
  updateProfile(profile: InferredProfile, newSignal: SessionSignal): Promise<InferredProfile>;
}

export interface CatalogPort {
  nearbyPlaces(query: PlaceQuery): Promise<Candidate[]>;
  nearbyEvents(query: EventQuery): Promise<Candidate[]>;
  books(query: BookQuery): Promise<Candidate[]>;
}

export interface BehaviorDrivenRecommendationPort {
  rank(candidates: Candidate[], context: RecoContext, profile?: InferredProfile): Promise<RankedRecommendation[]>;
}

export interface LocationPort {
  getUserLocation(): Promise<LocationResult | PermissionDenied>;
  checkLocationPermission(): Promise<boolean>;
  requestLocationPermission(): Promise<boolean>;
}