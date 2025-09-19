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