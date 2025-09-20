import { ConfigPort } from '../../domain/recommendationPorts';

export class ConfigService implements ConfigPort {
  private featureFlags: Record<string, boolean>;

  constructor() {
    this.featureFlags = this.parseFeatureFlags();
  }

  getFeatureFlags(): Record<string, boolean> {
    return this.featureFlags;
  }

  getApiBaseUrl(): string {
    return import.meta.env.VITE_RECO_API_BASE_URL || 'http://localhost:3001/api';
  }

  getApiKey(): string {
    return import.meta.env.VITE_RECO_API_KEY || '';
  }

  getMapTileUrl(): string {
    return import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }

  private parseFeatureFlags(): Record<string, boolean> {
    const flagsString = import.meta.env.VITE_FEATURE_FLAGS;
    if (!flagsString) {
      return {
        enableMap: true,
        enableFamilyMode: true,
        enableEvents: false,
        enableAnalytics: false
      };
    }

    try {
      return JSON.parse(flagsString);
    } catch (error) {
      console.warn('Failed to parse feature flags, using defaults:', error);
      return {
        enableMap: true,
        enableFamilyMode: true,
        enableEvents: false,
        enableAnalytics: false
      };
    }
  }

  isFeatureEnabled(feature: string): boolean {
    return this.featureFlags[feature] === true;
  }
}