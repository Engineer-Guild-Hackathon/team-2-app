import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/i18nContext';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // オンライン復帰時のアナリティクス
        setTimeout(() => setWasOffline(false), 3000); // 3秒後にメッセージを非表示
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !wasOffline) {
    return null; // オンラインで問題ない場合は何も表示しない
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}
      role="status"
      aria-live="polite"
    >
      {!isOnline ? (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg" role="img" aria-label="オフライン">📵</span>
            <span>
              インターネット接続がありません。一部の機能が制限される場合があります。
            </span>
          </div>
        </div>
      ) : wasOffline ? (
        <div className="bg-green-600 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-lg" role="img" aria-label="オンライン">✅</span>
            <span>
              インターネット接続が復旧しました
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}