import { ConfigService } from './config/configService';
import {
  MockRecommendationAdapter,
  MockLocationAdapter,
  MockCatalogAdapter,
  MockAnalyticsAdapter
} from './adapters/mockRecommendationAdapter';
import {
  HttpRecommendationAdapter,
  BrowserLocationAdapter,
  HttpCatalogAdapter,
  HttpAnalyticsAdapter
} from './adapters/httpRecommendationAdapter';
import { AIRecommendationService } from '../usecase/aiRecommendationService';
import {
  RecommendationPort,
  LocationPort,
  CatalogPort,
  AnalyticsPort,
  ConfigPort
} from '../domain/recommendationPorts';

export class Container {
  private static instance: Container;
  private configService: ConfigService;
  private recommendationPort!: RecommendationPort;
  private locationPort!: LocationPort;
  private catalogPort!: CatalogPort;
  private analyticsPort!: AnalyticsPort;
  private aiRecommendationService!: AIRecommendationService;

  private constructor() {
    this.configService = new ConfigService();
    this.initializeAdapters();
    this.aiRecommendationService = new AIRecommendationService(
      this.recommendationPort,
      this.locationPort,
      this.catalogPort,
      this.analyticsPort
    );
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private initializeAdapters(): void {
    const isDevelopment = import.meta.env.DEV;
    const useMock = import.meta.env.VITE_USE_MOCK_ADAPTERS === 'true' || isDevelopment;

    if (useMock) {
      // Mock adapters for development
      this.recommendationPort = new MockRecommendationAdapter();
      this.locationPort = new MockLocationAdapter();
      this.catalogPort = new MockCatalogAdapter();
      this.analyticsPort = new MockAnalyticsAdapter();
    } else {
      // HTTP adapters for production
      this.recommendationPort = new HttpRecommendationAdapter(this.configService);
      this.locationPort = new BrowserLocationAdapter();
      this.catalogPort = new HttpCatalogAdapter(this.configService);
      this.analyticsPort = new HttpAnalyticsAdapter(this.configService);
    }
  }

  getConfigService(): ConfigPort {
    return this.configService;
  }

  getRecommendationPort(): RecommendationPort {
    return this.recommendationPort;
  }

  getLocationPort(): LocationPort {
    return this.locationPort;
  }

  getCatalogPort(): CatalogPort {
    return this.catalogPort;
  }

  getAnalyticsPort(): AnalyticsPort {
    return this.analyticsPort;
  }

  getAIRecommendationService(): AIRecommendationService {
    return this.aiRecommendationService;
  }

  // テスト用にアダプターを差し替えるメソッド
  setRecommendationPort(port: RecommendationPort): void {
    this.recommendationPort = port;
    this.aiRecommendationService = new AIRecommendationService(
      this.recommendationPort,
      this.locationPort,
      this.catalogPort,
      this.analyticsPort
    );
  }

  setLocationPort(port: LocationPort): void {
    this.locationPort = port;
    this.aiRecommendationService = new AIRecommendationService(
      this.recommendationPort,
      this.locationPort,
      this.catalogPort,
      this.analyticsPort
    );
  }

  setCatalogPort(port: CatalogPort): void {
    this.catalogPort = port;
    this.aiRecommendationService = new AIRecommendationService(
      this.recommendationPort,
      this.locationPort,
      this.catalogPort,
      this.analyticsPort
    );
  }

  setAnalyticsPort(port: AnalyticsPort): void {
    this.analyticsPort = port;
    this.aiRecommendationService = new AIRecommendationService(
      this.recommendationPort,
      this.locationPort,
      this.catalogPort,
      this.analyticsPort
    );
  }
}