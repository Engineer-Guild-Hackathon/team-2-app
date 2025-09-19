import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import {
  Recommendation,
  RecommendationCategory,
  RecommendationMode,
  GeoPoint
} from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useAnnouncement } from '../../../hooks/useAnnouncement';
import { Container } from '../../../infrastructure/container';
import { RecommendationCard } from './RecommendationCard';
import { CategoryTabs } from './CategoryTabs';
import { ModeSelector } from './ModeSelector';
import LoadingSpinner from '../../ui/LoadingSpinner';
import Button from '../../ui/Button';
import { ErrorAlert } from '../../ui/ErrorAlert';
import { OfflineIndicator } from '../../ui/OfflineIndicator';
import { SkipLink } from '../../ui/SkipLink';

interface RecommendationsHomeProps {
  onRecommendationClick?: (recommendation: Recommendation) => void;
}

export function RecommendationsHome({ onRecommendationClick }: RecommendationsHomeProps) {
  const handleRecommendationClick = onRecommendationClick || (() => {});
  const { t } = useTranslation();
  const { error, clearError, handleError, retryLastAction, isRetrying } = useErrorHandler();
  const { announceSearchResults, announceLoading, announceError } = useAnnouncement();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode } = useParams<{ mode: string }>();

  // State
  const [selectedMode, setSelectedMode] = useState<RecommendationMode>(
    (mode as RecommendationMode) || 'learner'
  );
  const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [todaysRecommendations, setTodaysRecommendations] = useState<Recommendation[]>([]);
  const [nearbyRecommendations, setNearbyRecommendations] = useState<Recommendation[]>([]);
  const [categoryRecommendations, setCategoryRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  // Services
  const container = Container.getInstance();
  const aiRecommendationService = container.getAIRecommendationService();

  // URL sync
  useEffect(() => {
    const modeFromUrl = searchParams.get('mode') as RecommendationMode;
    const categoryFromUrl = searchParams.get('category') as RecommendationCategory;

    if (modeFromUrl && (modeFromUrl === 'learner' || modeFromUrl === 'family')) {
      setSelectedMode(modeFromUrl);
    }

    if (categoryFromUrl && ['park', 'museum', 'library', 'book', 'event'].includes(categoryFromUrl)) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  // Update URL when state changes
  const updateUrl = useCallback((mode: RecommendationMode, category: RecommendationCategory | null) => {
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('mode', mode);
    if (category) {
      newSearchParams.set('category', category);
    }
    setSearchParams(newSearchParams);
  }, [setSearchParams]);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    try {
      const result = await aiRecommendationService.getUserLocation();

      if ('type' in result) {
        setLocationPermissionStatus('denied');
        handleError(new Error(result.message), {
          component: 'RecommendationsHome',
          action: 'requestLocationPermission'
        });
      } else {
        setLocationPermissionStatus('granted');
        setCurrentLocation(result.coords);
        clearError();
      }
    } catch (err) {
      setLocationPermissionStatus('denied');
      handleError(err as Error, {
        component: 'RecommendationsHome',
        action: 'requestLocationPermission'
      });
    }
  }, [aiRecommendationService, handleError, clearError]);

  // Load today's recommendations
  const loadTodaysRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      announceLoading('今日のおすすめ');

      const recommendations = await aiRecommendationService.getTodaysRecommendations(
        currentLocation || undefined,
        selectedMode
      );

      setTodaysRecommendations(recommendations);
      announceSearchResults(recommendations.length, '今日のおすすめ');
      clearError();
    } catch (err) {
      console.error('Failed to load today\'s recommendations:', err);
      const errorMessage = err instanceof Error ? err.message : 'おすすめの読み込みに失敗しました';
      announceError(errorMessage);
      handleError(err as Error, {
        component: 'RecommendationsHome',
        action: 'loadTodaysRecommendations'
      });
    } finally {
      setLoading(false);
    }
  }, [aiRecommendationService, currentLocation, selectedMode, handleError, clearError, announceLoading, announceSearchResults, announceError]);

  // Load nearby recommendations
  const loadNearbyRecommendations = useCallback(async () => {
    if (!currentLocation) return;

    try {
      const recommendations = await aiRecommendationService.getNearbyRecommendations(
        currentLocation,
        selectedMode
      );
      setNearbyRecommendations(recommendations);
    } catch (err) {
      console.error('Failed to load nearby recommendations:', err);
      handleError(err as Error, {
        component: 'RecommendationsHome',
        action: 'loadNearbyRecommendations'
      });
    }
  }, [aiRecommendationService, currentLocation, selectedMode]);

  // Load category recommendations
  const loadCategoryRecommendations = useCallback(async () => {
    if (!selectedCategory) {
      setCategoryRecommendations([]);
      return;
    }

    try {
      const recommendations = await aiRecommendationService.getRecommendationsByCategory(
        selectedCategory,
        currentLocation || undefined,
        selectedMode
      );
      setCategoryRecommendations(recommendations);
    } catch (err) {
      console.error('Failed to load category recommendations:', err);
      handleError(err as Error, {
        component: 'RecommendationsHome',
        action: 'loadCategoryRecommendations'
      });
    }
  }, [aiRecommendationService, selectedCategory, currentLocation, selectedMode]);

  // Mode change handler
  const handleModeChange = useCallback((mode: RecommendationMode) => {
    setSelectedMode(mode);
    updateUrl(mode, selectedCategory);
  }, [selectedCategory, updateUrl]);

  // Category change handler
  const handleCategoryChange = useCallback((category: RecommendationCategory | null) => {
    setSelectedCategory(category);
    updateUrl(selectedMode, category);
  }, [selectedMode, updateUrl]);

  // Effects
  useEffect(() => {
    loadTodaysRecommendations();
  }, [loadTodaysRecommendations]);

  useEffect(() => {
    if (currentLocation) {
      loadNearbyRecommendations();
    }
  }, [loadNearbyRecommendations]);

  useEffect(() => {
    loadCategoryRecommendations();
  }, [loadCategoryRecommendations]);

  // Check location permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await aiRecommendationService.checkLocationPermission();
      if (hasPermission) {
        await requestLocationPermission();
      }
    };

    checkPermission();
  }, [aiRecommendationService, requestLocationPermission]);

  return (
    <>
      <SkipLink targetId="main-content" />
      <OfflineIndicator />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <main id="main-content" tabIndex={-1}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('recommendations.title')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('recommendations.subtitle')}
        </p>
      </div>

      {/* Mode Selector */}
      <ModeSelector
        selectedMode={selectedMode}
        onModeChange={handleModeChange}
        className="max-w-2xl mx-auto"
      />

      {/* Location Section */}
      {locationPermissionStatus === 'unknown' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                {t('location.permissionTitle')}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {t('location.permissionMessage')}
              </p>
            </div>
            <Button
              onClick={requestLocationPermission}
              className="ml-4"
              data-testid="location-permission-button"
            >
              {t('location.requestPermission')}
            </Button>
          </div>
        </div>
      )}

      {locationPermissionStatus === 'denied' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-yellow-900">
                {t('location.permissionDenied')}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                {t('location.permissionDeniedMessage')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={requestLocationPermission}
              className="ml-4"
            >
              {t('common.retry')}
            </Button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm py-2"
      />

      {/* Error State */}
      {error && (
        <ErrorAlert
          error={error}
          onRetry={retryLastAction}
          onDismiss={clearError}
          className="mb-6"
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Today's Recommendations */}
      {!selectedCategory && !loading && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('recommendations.todaysRecommendations')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {todaysRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onClick={handleRecommendationClick}
              />
            ))}
          </div>
          {todaysRecommendations.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              {t('empty.noRecommendations')}
            </div>
          )}
        </section>
      )}

      {/* Nearby Recommendations */}
      {!selectedCategory && currentLocation && nearbyRecommendations.length > 0 && !loading && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t('recommendations.nearbyRecommendations')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onClick={handleRecommendationClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category Recommendations */}
      {selectedCategory && !loading && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t(`recommendations.categories.${selectedCategory}`)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryRecommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onClick={handleRecommendationClick}
              />
            ))}
          </div>
          {categoryRecommendations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('empty.noResults')}
            </div>
          )}
        </section>
      )}
        </main>
      </div>
    </>
  );
}