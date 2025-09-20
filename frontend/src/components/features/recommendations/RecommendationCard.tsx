import React, { memo, useRef, useEffect } from 'react';
import { Recommendation, RankedRecommendation, TelemetryEvent } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import { Container } from '../../../infrastructure/container';
import Badge from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { LazyImage } from '../../ui/LazyImage';
import { WhyButton } from '../../ui/WhyTooltip';

interface RecommendationCardProps {
  recommendation: Recommendation | RankedRecommendation;
  onClick: (recommendation: Recommendation | RankedRecommendation) => void;
  className?: string;
  trackViewTime?: boolean; // view_itemイベントの追跡を有効にするか
}

export const RecommendationCard = memo(function RecommendationCard({
  recommendation,
  onClick,
  className = '',
  trackViewTime = true
}: RecommendationCardProps) {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const viewStartTime = useRef<number | null>(null);
  const hasLogged = useRef(false);

  const container = Container.getInstance();
  const telemetryPort = container.getTelemetryPort();

  // RankedRecommendationかどうかを判定
  const isRankedRecommendation = (rec: Recommendation | RankedRecommendation): rec is RankedRecommendation => {
    return 'why' in rec && 'score' in rec;
  };

  const rankedRec = isRankedRecommendation(recommendation) ? recommendation : null;

  // view_itemイベントの記録
  const logViewItem = (dwellMs: number, scrollDepth: number = 0.5) => {
    if (!trackViewTime || hasLogged.current) return;

    const event: TelemetryEvent = {
      name: 'view_item',
      ts: new Date().toISOString(),
      payload: {
        id: recommendation.id,
        kind: recommendation.kind,
        dwell_ms: dwellMs,
        scroll_depth: scrollDepth,
        category: rankedRec?.category || recommendation.kind,
        tags: recommendation.tags,
        score: rankedRec?.score || 0,
        distanceKm: recommendation.distanceKm
      }
    };

    telemetryPort.capture(event);
    hasLogged.current = true;
  };

  // カード表示時間の追跡
  useEffect(() => {
    if (!trackViewTime) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            viewStartTime.current = Date.now();
          } else if (viewStartTime.current) {
            const dwellMs = Date.now() - viewStartTime.current;
            if (dwellMs > 1000) { // 1秒以上の表示で記録
              logViewItem(dwellMs);
            }
            viewStartTime.current = null;
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
      // コンポーネント終了時にも記録
      if (viewStartTime.current) {
        const dwellMs = Date.now() - viewStartTime.current;
        if (dwellMs > 500) {
          logViewItem(dwellMs);
        }
      }
    };
  }, [trackViewTime]);

  const handleClick = () => {
    // クリック時のイベント記録
    if (trackViewTime) {
      const clickEvent: TelemetryEvent = {
        name: 'click_cta',
        ts: new Date().toISOString(),
        payload: {
          action: 'open_detail',
          item_id: recommendation.id
        }
      };
      telemetryPort.capture(clickEvent);
    }

    onClick(recommendation);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      ref={cardRef}
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
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                {recommendation.title}
              </h3>
              {rankedRec?.why && rankedRec.why.length > 0 && (
                <WhyButton
                  why={rankedRec.why}
                  size="sm"
                  variant="subtle"
                  className="flex-shrink-0"
                />
              )}
            </div>
            {recommendation.subtitle && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {recommendation.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center ml-2 gap-1">
            {rankedRec?.score && (
              <div className="flex items-center">
                <span className="text-yellow-400">★</span>
                <span className="text-sm text-gray-600 ml-1">
                  {rankedRec.score.toFixed(1)}
                </span>
              </div>
            )}
          </div>
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