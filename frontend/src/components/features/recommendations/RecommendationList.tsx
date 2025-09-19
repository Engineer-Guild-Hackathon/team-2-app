import React from 'react';
import { Recommendation } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import { useRecommendationFilters } from '../../../hooks/useRecommendationFilters';
import { RecommendationCard } from './RecommendationCard';
import { FilterDrawer } from './FilterDrawer';
import LoadingSpinner from '../../ui/LoadingSpinner';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

interface RecommendationListProps {
  recommendations: Recommendation[];
  onRecommendationClick: (recommendation: Recommendation) => void;
  loading?: boolean;
  className?: string;
}

export function RecommendationList({
  recommendations,
  onRecommendationClick,
  loading = false,
  className = ''
}: RecommendationListProps) {
  const { t } = useTranslation();
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

  // フィルターを適用した推奨リストを取得
  const filteredRecommendations = filterRecommendations(recommendations);

  // フィルター用の利用可能なオプションを取得
  const availableTags = getAvailableTags(recommendations);
  const availableAccessibility = getAvailableAccessibility(recommendations);

  if (loading) {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4" role="img" aria-label="空のリスト">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('empty.noResults')}
        </h3>
        <p className="text-gray-600">
          {t('empty.noResultsMessage')}
        </p>
      </div>
    );
  }

  if (filteredRecommendations.length === 0 && hasActiveFilters) {
    return (
      <div className={className}>
        {/* フィルターバー */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={openFilters}
              className="relative"
              aria-label={t('a11y.filterButton')}
            >
              🔍 {t('common.filter')}
              {hasActiveFilters && (
                <Badge
                  variant="info"
                  size="sm"
                  className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                {t('filter.clearAll')}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center py-12">
          <div className="text-6xl mb-4" role="img" aria-label="フィルター結果なし">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            フィルター条件に一致する結果がありません
          </h3>
          <p className="text-gray-600 mb-4">
            フィルター条件を調整してもう一度お試しください
          </p>
          <Button variant="outline" onClick={clearFilters}>
            {t('filter.clearAll')}
          </Button>
        </div>

        <FilterDrawer
          isOpen={filterState.isOpen}
          onClose={closeFilters}
          filters={filterState.options}
          onApplyFilters={applyFilters}
          availableTags={availableTags}
          availableAccessibility={availableAccessibility}
        />
      </div>
    );
  }

  return (
    <div className={className} role="region" aria-label="おすすめリスト">
      {/* フィルターバー */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={openFilters}
            className="relative"
            aria-label={t('a11y.filterButton')}
          >
            🔍 {t('common.filter')}
            {hasActiveFilters && (
              <Badge
                variant="info"
                size="sm"
                className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center"
              >
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} size="sm">
              {t('filter.clearAll')}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            onClick={onRecommendationClick}
            className={`transform transition-all duration-300 ${
              index % 3 === 0 ? 'animate-fade-in-up delay-100' :
              index % 3 === 1 ? 'animate-fade-in-up delay-200' :
              'animate-fade-in-up delay-300'
            }`}
          />
        ))}
      </div>

      {/* フィルタードロワー */}
      <FilterDrawer
        isOpen={filterState.isOpen}
        onClose={closeFilters}
        filters={filterState.options}
        onApplyFilters={applyFilters}
        availableTags={availableTags}
        availableAccessibility={availableAccessibility}
      />

      {/* 読み込み状況の表示 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        {hasActiveFilters ? (
          <>
            フィルター適用済み: {filteredRecommendations.length} / {recommendations.length} 件
          </>
        ) : (
          <>
            {t('recommendations.title')}: {recommendations.length}件
          </>
        )}
      </div>
    </div>
  );
}