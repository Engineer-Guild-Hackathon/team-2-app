import React from 'react';
import { GeoPoint } from '../../../types/recommendation';
import { useTranslation } from '../../../i18n/i18nContext';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';

interface LocationStatusProps {
  currentLocation: GeoPoint | null;
  permissionStatus: 'unknown' | 'granted' | 'denied';
  onRequestLocation: () => void;
  onOpenSettings: () => void;
  className?: string;
}

export function LocationStatus({
  currentLocation,
  permissionStatus,
  onRequestLocation,
  onOpenSettings,
  className = ''
}: LocationStatusProps) {
  const { t } = useTranslation();

  const getLocationText = () => {
    if (!currentLocation) return t('location.locationUnavailable');

    // 簡単な地域判定（実際のアプリではgeocoding APIを使用）
    const { lat, lng } = currentLocation;

    // 東京周辺の判定
    if (lat >= 35.5 && lat <= 35.8 && lng >= 139.5 && lng <= 139.9) {
      return '東京都周辺';
    }

    // 大阪周辺の判定
    if (lat >= 34.5 && lat <= 34.8 && lng >= 135.3 && lng <= 135.7) {
      return '大阪府周辺';
    }

    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  };

  const renderLocationIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <span className="text-green-600">📍</span>;
      case 'denied':
        return <span className="text-red-600">📍</span>;
      default:
        return <span className="text-gray-400">📍</span>;
    }
  };

  const renderStatusBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            位置情報ON
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="danger" className="border-red-200 text-red-600">
            位置情報OFF
          </Badge>
        );
      default:
        return (
          <Badge variant="info" className="border-gray-200 text-gray-600">
            未設定
          </Badge>
        );
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-xl" role="img" aria-label="位置情報">
            {renderLocationIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {t('location.currentLocation')}
              </span>
              {renderStatusBadge()}
            </div>

            <p className="text-sm text-gray-600 mt-1">
              {getLocationText()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {permissionStatus === 'unknown' && (
            <Button
              size="sm"
              onClick={onRequestLocation}
              data-testid="request-location-button"
            >
              位置情報を取得
            </Button>
          )}

          {permissionStatus === 'denied' && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRequestLocation}
            >
              {t('common.retry')}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenSettings}
            className="text-gray-600"
            aria-label="位置情報設定を開く"
          >
            <span className="text-sm">⚙️</span>
          </Button>
        </div>
      </div>

      {/* 位置情報が利用できない場合のヘルプ */}
      {permissionStatus === 'denied' && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-900 mb-1">
            位置情報が利用できません
          </h4>
          <p className="text-xs text-yellow-800">
            ブラウザの設定で位置情報の使用を許可するか、手動で地域を設定してください。
          </p>
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenSettings}
              className="text-xs"
            >
              手動で地域を設定
            </Button>
          </div>
        </div>
      )}

      {/* 位置情報の精度について */}
      {currentLocation && (
        <div className="mt-3 text-xs text-gray-500">
          <p>
            📊 位置精度: 約500m圏内 •
            🔒 プライバシー: セッション内でのみ使用
          </p>
        </div>
      )}
    </div>
  );
}