import React, { useState, useEffect, useCallback } from 'react';
import {
  Recommendation,
  RecommendationCategory,
  GeoPoint
} from '../../types/recommendation';
import { Container } from '../../infrastructure/container';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui';

interface ChildAIRecommendationsProps {
  loading?: boolean;
}

export function ChildAIRecommendations({ loading = false }: ChildAIRecommendationsProps) {
  const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const container = Container.getInstance();
  const aiRecommendationService = container.getAIRecommendationService();

  // カテゴリ情報（子ども向け）
  const categories = [
    {
      id: 'park' as RecommendationCategory,
      name: 'こうえん',
      emoji: '🏞️',
      description: 'たのしくあそべるよ',
      color: 'bg-green-100 border-green-300 text-green-800'
    },
    {
      id: 'museum' as RecommendationCategory,
      name: 'はくぶつかん',
      emoji: '🏛️',
      description: 'いろんなものがみれるよ',
      color: 'bg-purple-100 border-purple-300 text-purple-800'
    },
    {
      id: 'library' as RecommendationCategory,
      name: 'としょかん',
      emoji: '📚',
      description: 'ほんがたくさんあるよ',
      color: 'bg-blue-100 border-blue-300 text-blue-800'
    },
    {
      id: 'book' as RecommendationCategory,
      name: 'ほん',
      emoji: '📖',
      description: 'おもしろいほんだよ',
      color: 'bg-orange-100 border-orange-300 text-orange-800'
    },
    {
      id: 'event' as RecommendationCategory,
      name: 'いべんと',
      emoji: '🎪',
      description: 'たのしいおまつりだよ',
      color: 'bg-pink-100 border-pink-300 text-pink-800'
    }
  ];

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);
      const result = await aiRecommendationService.getUserLocation();

      if ('type' in result) {
        setLocationPermissionStatus('denied');
        return;
      }

      setCurrentLocation(result.coords);
      setLocationPermissionStatus('granted');
      await loadRecommendations(result.coords);
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

      if (selectedCategory) {
        const result = await aiRecommendationService.getRecommendationsByCategory(
          selectedCategory,
          coords || currentLocation || undefined,
          'learner'
        );
        setRecommendations(result);
      } else {
        const result = await aiRecommendationService.getTodaysRecommendations(
          coords || currentLocation || undefined,
          'learner'
        );
        setRecommendations(result);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [selectedCategory]);

  const handleCategoryClick = (categoryId: RecommendationCategory | null) => {
    setSelectedCategory(categoryId);
  };

  const handleRecommendationClick = (recommendation: Recommendation) => {
    // 子ども向けに詳細表示を簡素化
    const subtitle = recommendation.subtitle || 'たのしいところだよ！';
    alert(`${recommendation.title}にいってみよう！\n\n${subtitle}`);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 flex justify-center items-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <LoadingSpinner size="lg" />
          <p className="text-2xl font-bold text-orange-800 mt-4">ちょっとまってね...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-orange-100 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <div className="text-6xl mb-4">🤖✨</div>
          <h1 className="text-4xl font-bold text-orange-800 mb-2">
            AIがおしえてくれるよ！
          </h1>
          <p className="text-xl text-orange-700">
            きみにぴったりなところをみつけよう
          </p>
        </div>

        {/* 位置情報セクション */}
        {locationPermissionStatus === 'unknown' && (
          <Card className="bg-gradient-to-r from-blue-200 to-purple-200 border-2 border-blue-300 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-2xl font-bold text-blue-800 mb-2">
                きみのばしょをおしえて！
              </h3>
              <p className="text-lg text-blue-700 mb-4">
                ちかくのたのしいところをみつけるよ
              </p>
              <Button
                onClick={requestLocationPermission}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white text-xl py-4 px-8 rounded-2xl font-bold shadow-lg transform hover:scale-105 transition-all"
              >
                🗺️ ばしょをおしえる
              </Button>
            </CardContent>
          </Card>
        )}

        {locationPermissionStatus === 'granted' && currentLocation && (
          <div className="bg-green-200 border-2 border-green-400 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-lg font-bold text-green-800">
              きみのちかくで{recommendations.length}こみつけたよ！
            </p>
          </div>
        )}

        {/* カテゴリ選択 */}
        <div>
          <h2 className="text-3xl font-bold text-center text-orange-800 mb-6">
            なにがみたい？
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <Card
              className={`cursor-pointer transition-all duration-300 hover:scale-105 transform border-4 ${
                selectedCategory === null
                  ? 'bg-yellow-200 border-yellow-400 ring-4 ring-yellow-300'
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
              }`}
              onClick={() => handleCategoryClick(null)}
            >
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-2">🌟</div>
                <h3 className="text-xl font-bold text-gray-800">ぜんぶ</h3>
                <p className="text-sm text-gray-600">なんでもみる</p>
              </CardContent>
            </Card>

            {categories.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all duration-300 hover:scale-105 transform border-4 ${
                  selectedCategory === category.id
                    ? `${category.color} ring-4 ring-current ring-opacity-50`
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-2">{category.emoji}</div>
                  <h3 className="text-xl font-bold text-gray-800">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* おすすめ一覧 */}
        <div>
          <h2 className="text-3xl font-bold text-center text-orange-800 mb-6">
            {selectedCategory
              ? `${categories.find(c => c.id === selectedCategory)?.name}のおすすめ`
              : 'きょうのおすすめ'
            }
          </h2>

          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😅</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">
                まだみつからないよ
              </h3>
              <p className="text-lg text-gray-600">
                ほかのカテゴリをえらんでみてね
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation, index) => (
                <Card
                  key={recommendation.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 transform bg-white border-3 shadow-lg ${
                    index % 4 === 0 ? 'border-red-300 hover:border-red-400' :
                    index % 4 === 1 ? 'border-blue-300 hover:border-blue-400' :
                    index % 4 === 2 ? 'border-green-300 hover:border-green-400' :
                    'border-purple-300 hover:border-purple-400'
                  }`}
                  onClick={() => handleRecommendationClick(recommendation)}
                >
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">
                        {recommendation.kind === 'place' && '🏞️'}
                        {recommendation.kind === 'book' && '📖'}
                        {recommendation.kind === 'event' && '🎪'}
                        {!recommendation.kind && '⭐'}
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {recommendation.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {recommendation.subtitle || 'たのしいところだよ！'}
                    </p>

                    {recommendation.tags.length > 0 && (
                      <div className="text-center mb-2">
                        <div className="flex flex-wrap justify-center gap-1">
                          {recommendation.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span key={tagIndex} className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {recommendation.distanceKm && (
                      <div className="text-center mt-2">
                        <span className="text-sm text-gray-500">
                          📍 {recommendation.distanceKm.toFixed(1)}km
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ホームに戻るボタン */}
        <div className="text-center">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            size="lg"
            className="bg-white text-orange-700 border-2 border-orange-300 hover:bg-orange-50 text-xl py-4 px-8 rounded-2xl font-bold"
          >
            🏠 ホームにもどる
          </Button>
        </div>
      </div>
    </div>
  );
}