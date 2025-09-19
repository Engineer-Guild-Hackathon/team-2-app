import React from 'react';
import { Recommendation } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import { RecommendationCard } from './RecommendationCard';
import LoadingSpinner from '../../ui/LoadingSpinner';

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

  return (
    <div className={className} role="region" aria-label="おすすめリスト">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((recommendation, index) => (
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

      {/* 読み込み状況の表示 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        {t('recommendations.title')}: {recommendations.length}件
      </div>
    </div>
  );
}