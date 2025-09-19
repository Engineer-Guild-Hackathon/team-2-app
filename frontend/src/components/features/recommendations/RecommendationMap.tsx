import React, { useEffect, useRef, useState } from 'react';
import { Recommendation, GeoPoint } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import { Container } from '../../../infrastructure/container';
import LoadingSpinner from '../../ui/LoadingSpinner';
import Button from '../../ui/Button';

interface RecommendationMapProps {
  recommendations: Recommendation[];
  currentLocation: GeoPoint | null;
  onRecommendationClick: (recommendation: Recommendation) => void;
  className?: string;
}

export function RecommendationMap({
  recommendations,
  currentLocation,
  onRecommendationClick,
  className = ''
}: RecommendationMapProps) {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const container = Container.getInstance();
  const config = container.getConfigService();

  // フィーチャーフラグでマップが有効かチェック
  const isMapEnabled = config.getFeatureFlags().enableMap;

  useEffect(() => {
    if (!isMapEnabled) return;

    // ここでマップライブラリを初期化
    // 実際の実装では、Leaflet、Mapbox、Google Mapsなどを使用
    initializeMap();
  }, [isMapEnabled]);

  const initializeMap = async () => {
    try {
      setMapLoaded(false);
      setMapError(null);

      // マップの初期化をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 実際の実装では、ここでマップライブラリを初期化
      // 例: Leafletの場合
      // const L = await import('leaflet');
      // const map = L.map(mapContainerRef.current).setView([35.6812, 139.7671], 13);
      // L.tileLayer(config.getMapTileUrl()).addTo(map);

      setMapLoaded(true);
    } catch (error) {
      setMapError(error instanceof Error ? error.message : 'マップの読み込みに失敗しました');
    }
  };

  if (!isMapEnabled) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <div className="text-4xl mb-4" role="img" aria-label="マップ無効">🗺️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          マップ機能は現在利用できません
        </h3>
        <p className="text-gray-600">
          設定でマップ機能を有効にしてください
        </p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center ${className}`}>
        <div className="text-4xl mb-4" role="img" aria-label="マップエラー">❌</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">
          マップの読み込みに失敗しました
        </h3>
        <p className="text-red-700 mb-4">{mapError}</p>
        <Button onClick={initializeMap} variant="outline">
          再試行
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {/* マップコンテナ */}
      <div
        ref={mapContainerRef}
        className="w-full h-96 bg-gray-200 flex items-center justify-center"
        role="application"
        aria-label="おすすめスポットマップ"
      >
        {!mapLoaded ? (
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-600">マップを読み込み中...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-4" role="img" aria-label="マップ">🗺️</div>
            <p className="text-gray-600">
              マップ機能は開発中です
            </p>
            <p className="text-sm text-gray-500 mt-2">
              位置: {currentLocation ? `${currentLocation.lat.toFixed(3)}, ${currentLocation.lng.toFixed(3)}` : '未設定'}
            </p>
          </div>
        )}
      </div>

      {/* マップオーバーレイ - おすすめ件数 */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              📍 {recommendations.length}件のおすすめ
            </span>
          </div>
        </div>
      )}

      {/* マップコントロール */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 backdrop-blur-sm"
            onClick={() => {
              // 現在地に移動する処理
            }}
            aria-label="現在地に移動"
          >
            📍
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 backdrop-blur-sm"
            onClick={() => {
              // ズームリセット処理
            }}
            aria-label="ズームリセット"
          >
            🔍
          </Button>
        </div>
      )}

      {/* おすすめポイントのリスト（マップ下部） */}
      {mapLoaded && recommendations.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 max-h-32 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              マップ上のおすすめスポット
            </h3>
            <div className="space-y-1">
              {recommendations.slice(0, 3).map((recommendation, index) => (
                <button
                  key={recommendation.id}
                  onClick={() => onRecommendationClick(recommendation)}
                  className="w-full text-left p-2 hover:bg-gray-100 rounded text-sm flex items-center space-x-2"
                >
                  <span className="text-blue-600">📍</span>
                  <span className="flex-1 truncate">{recommendation.title}</span>
                  {recommendation.distanceKm && (
                    <span className="text-gray-500 text-xs">
                      {recommendation.distanceKm.toFixed(1)}km
                    </span>
                  )}
                </button>
              ))}
              {recommendations.length > 3 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  他 {recommendations.length - 3}件
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}