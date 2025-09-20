import React, { useState, useEffect, useCallback } from 'react';
import {
  Recommendation,
  RecommendationCategory,
  RecommendationMode,
  GeoPoint,
  LocationResult
} from '../../types/recommendation';
import { Container } from '../../infrastructure/container';
import { RecommendationCard } from './recommendations/RecommendationCard';
import { CategoryTabs } from './recommendations/CategoryTabs';
import { RecommendationDetailModal } from './recommendations/RecommendationDetailModal';
import { FilterDrawer } from './recommendations/FilterDrawer';
import { useRecommendationFilters } from '../../hooks/useRecommendationFilters';
import { Card, CardContent, Button } from '../ui';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AdultAIRecommendationsProps {
  loading?: boolean;
}

export function AdultAIRecommendations({ loading = false }: AdultAIRecommendationsProps) {
  const [selectedMode, setSelectedMode] = useState<RecommendationMode>('family');
  const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const {
    filterState,
    openFilters,
    closeFilters,
    applyFilters,
    clearFilters,
    filterRecommendations,
    getActiveFilterCount,
    getAvailableTags,
    getAvailableAccessibility,
    hasActiveFilters
  } = useRecommendationFilters();

  const container = Container.getInstance();
  const aiRecommendationService = container.getAIRecommendationService();
  const locationPort = container.getLocationPort();

  const filteredRecommendations = filterRecommendations(recommendations);
  const availableTags = getAvailableTags(recommendations);
  const availableAccessibility = getAvailableAccessibility(recommendations);

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);

      // 位置情報許可をリクエスト
      const permissionGranted = await locationPort.requestLocationPermission();

      if (!permissionGranted) {
        setLocationPermissionStatus('denied');
        return;
      }

      // 現在地を取得
      const result = await locationPort.getUserLocation();

      // 型ガードを使用してPermissionDeniedかLocationResultかを判定
      if ('type' in result && result.type === 'permission_denied') {
        setLocationPermissionStatus('denied');
        return;
      }

      // この時点でresultはLocationResult型
      const locationResult = result as LocationResult;
      setCurrentLocation(locationResult.coords);
      setLocationPermissionStatus('granted');

      await loadRecommendations(locationResult.coords);
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermissionStatus('denied');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecommendations = async (coords?: GeoPoint) => {
    try {
      setIsLoading(true);
      const result = await aiRecommendationService.getRecommendations({
        mode: selectedMode,
        coords: coords || currentLocation || undefined,
        radiusKm: 10,
        categories: selectedCategory ? [selectedCategory] : undefined,
        limit: 20
      });
      setRecommendations(result);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [selectedMode, selectedCategory]);

  const handleModeToggle = () => {
    setSelectedMode(prev => prev === 'family' ? 'learner' : 'family');
  };

  const handleRecommendationClick = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation.id);
  };

  const closeDetailModal = () => {
    setSelectedRecommendation(null);
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AIおすすめスポット・図書
          </h1>
          <p className="text-gray-600">
            家族での学習に最適な場所や本をAIが提案します
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleModeToggle}
            variant="outline"
            className={`${
              selectedMode === 'family'
                ? 'bg-purple-100 text-purple-700 border-purple-300'
                : 'bg-blue-100 text-blue-700 border-blue-300'
            }`}
          >
            {selectedMode === 'family' ? '👨‍👩‍👧‍👦 家族モード' : '🎓 学習者モード'}
          </Button>

          {locationPermissionStatus === 'unknown' && (
            <Button onClick={requestLocationPermission} className="bg-green-600 hover:bg-green-700">
              📍 位置情報を使用
            </Button>
          )}
        </div>
      </div>

      {/* Mode Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {selectedMode === 'family' ? '👨‍👩‍👧‍👦' : '🎓'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {selectedMode === 'family' ? '家族モード' : '学習者モード'}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedMode === 'family'
                  ? '家族みんなで楽しめる学習スポットをおすすめします'
                  : '個人の学習に最適な環境をおすすめします'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Status */}
      {locationPermissionStatus === 'granted' && currentLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-green-800">
            <span>📍</span>
            <span className="text-sm font-medium">
              現在地から{filteredRecommendations.length}件のおすすめを表示中
            </span>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={openFilters}
            className="relative"
          >
            🔍 フィルタ
            {hasActiveFilters && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} size="sm">
              クリア
            </Button>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {hasActiveFilters ? (
            <>
              {filteredRecommendations.length} / {recommendations.length} 件表示
            </>
          ) : (
            <>
              {recommendations.length} 件
            </>
          )}
        </div>
      </div>

      {/* Recommendations Grid */}
      {filteredRecommendations.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            おすすめが見つかりませんでした
          </h3>
          <p className="text-gray-600 mb-4">
            フィルター条件を調整するか、位置情報を有効にしてお試しください
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              フィルターをクリア
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation, index) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onClick={handleRecommendationClick}
              className={`transform transition-all duration-300 ${
                index % 3 === 0 ? 'animate-fade-in-up delay-100' :
                index % 3 === 1 ? 'animate-fade-in-up delay-200' :
                'animate-fade-in-up delay-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={filterState.isOpen}
        onClose={closeFilters}
        filters={filterState.options}
        onApplyFilters={applyFilters}
        availableTags={availableTags}
        availableAccessibility={availableAccessibility}
      />

      {/* Detail Modal */}
      <RecommendationDetailModal
        isOpen={!!selectedRecommendation}
        onClose={closeDetailModal}
        recommendationId={selectedRecommendation}
        mode={selectedMode}
      />
    </div>
  );
}