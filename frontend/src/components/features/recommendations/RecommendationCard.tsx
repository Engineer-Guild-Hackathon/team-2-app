import React, { memo } from 'react';
import { Recommendation } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import Badge from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { LazyImage } from '../../ui/LazyImage';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onClick: (recommendation: Recommendation) => void;
  className?: string;
}

export const RecommendationCard = memo(function RecommendationCard({
  recommendation,
  onClick,
  className = ''
}: RecommendationCardProps) {
  const { t } = useTranslation();

  const handleClick = () => {
    onClick(recommendation);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(recommendation);
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${recommendation.title} - ${t('a11y.recommendationCard')}`}
      data-testid={`recommendation-card-${recommendation.id}`}
    >
      <div className="relative">
        {recommendation.thumbnail && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gray-100">
            <LazyImage
              src={recommendation.thumbnail}
              alt={`${recommendation.title} ${t('a11y.imageAlt')}`}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Distance badge */}
        {recommendation.distanceKm !== undefined && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="bg-white/90 text-gray-800">
              {recommendation.distanceKm.toFixed(1)}{t('recommendations.distanceUnit')}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {recommendation.title}
            </h3>
            {recommendation.subtitle && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {recommendation.subtitle}
              </p>
            )}
          </div>

          {recommendation.score && (
            <div className="flex items-center ml-2">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">
                {recommendation.score.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {/* Tags */}
          {recommendation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recommendation.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="info" size="sm">
                  {tag}
                </Badge>
              ))}
              {recommendation.tags.length > 3 && (
                <Badge variant="info" size="sm">
                  +{recommendation.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Price and Hours */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              {recommendation.price && (
                <span className={recommendation.price === 'free' ? 'text-green-600 font-medium' : ''}>
                  {recommendation.price === 'free' ? t('common.free') : recommendation.price}
                </span>
              )}
              {recommendation.openHours && (
                <span>• {recommendation.openHours}</span>
              )}
            </div>
          </div>

          {/* Badges */}
          {recommendation.badges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recommendation.badges.slice(0, 2).map((badge, index) => (
                <Badge key={index} variant="default" size="sm" className="bg-blue-100 text-blue-800">
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {/* Accessibility */}
          {recommendation.accessibility.length > 0 && (
            <div className="flex items-center text-xs text-gray-500">
              <span className="mr-1">♿</span>
              <span className="truncate">
                {recommendation.accessibility.slice(0, 2).join(', ')}
                {recommendation.accessibility.length > 2 && '...'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});