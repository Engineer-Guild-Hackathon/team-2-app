import React from 'react';
import { AppError } from '../../types/errors';
import { useTranslation } from '../../i18n/i18nContext';
import Button from './Button';

interface ErrorAlertProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  className = '',
  compact = false
}: ErrorAlertProps) {
  const { t } = useTranslation();

  const getErrorIcon = (type: AppError['type']) => {
    switch (type) {
      case 'network':
        return '📡';
      case 'permission':
        return '🔒';
      case 'location':
        return '📍';
      case 'api':
        return '⚠️';
      case 'timeout':
        return '⏱️';
      default:
        return '❌';
    }
  };

  const getErrorColor = (type: AppError['type']) => {
    switch (type) {
      case 'network':
      case 'timeout':
        return 'yellow';
      case 'permission':
      case 'api':
        return 'red';
      case 'location':
        return 'blue';
      default:
        return 'red';
    }
  };

  const colorClasses = {
    red: {
      container: 'bg-red-50 border-red-200',
      title: 'text-red-900',
      message: 'text-red-700',
      button: 'text-red-600 hover:text-red-500'
    },
    yellow: {
      container: 'bg-yellow-50 border-yellow-200',
      title: 'text-yellow-900',
      message: 'text-yellow-700',
      button: 'text-yellow-600 hover:text-yellow-500'
    },
    blue: {
      container: 'bg-blue-50 border-blue-200',
      title: 'text-blue-900',
      message: 'text-blue-700',
      button: 'text-blue-600 hover:text-blue-500'
    }
  };

  const color = getErrorColor(error.type);
  const colors = colorClasses[color];

  if (compact) {
    return (
      <div className={`flex items-center p-3 border rounded-lg ${colors.container} ${className}`}>
        <span className="text-lg mr-2" role="img" aria-hidden="true">
          {getErrorIcon(error.type)}
        </span>
        <span className={`text-sm flex-1 ${colors.message}`}>
          {error.message}
        </span>
        <div className="flex items-center space-x-2 ml-3">
          {error.recoverable && onRetry && (
            <button
              onClick={onRetry}
              className={`text-sm font-medium ${colors.button} underline`}
            >
              {t('common.retry')}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600"
              aria-label={t('common.close')}
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-6 ${colors.container} ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl" role="img" aria-hidden="true">
            {getErrorIcon(error.type)}
          </span>
        </div>

        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${colors.title} mb-1`}>
            {getErrorTitle(error.type, t)}
          </h3>
          <p className={`text-sm ${colors.message} mb-4`}>
            {error.message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {error.recoverable && onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="primary"
              >
                {t('common.retry')}
              </Button>
            )}

            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="outline"
              >
                {t('common.close')}
              </Button>
            )}

            {error.type === 'network' && (
              <button
                onClick={() => window.location.reload()}
                className={`text-sm ${colors.button} underline`}
              >
                ページを再読み込み
              </button>
            )}
          </div>

          {/* 開発環境での詳細情報 */}
          {import.meta.env.DEV && error.details && (
            <details className="mt-4">
              <summary className={`text-xs ${colors.button} cursor-pointer`}>
                開発者向け詳細
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600"
            aria-label={t('common.close')}
          >
            <span className="text-lg">×</span>
          </button>
        )}
      </div>
    </div>
  );
}

function getErrorTitle(type: AppError['type'], t: (key: string) => string): string {
  switch (type) {
    case 'network':
      return t('error.network');
    case 'permission':
      return '権限エラー';
    case 'location':
      return t('error.location');
    case 'api':
      return t('error.server');
    case 'timeout':
      return 'タイムアウトエラー';
    default:
      return t('error.general');
  }
}