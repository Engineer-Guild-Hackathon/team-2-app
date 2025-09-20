import { useState, useCallback } from 'react';
import { AppError, createError, getErrorType, ErrorContext } from '../types/errors';
import { useTranslation } from '../i18n/i18nContext';

interface UseErrorHandlerReturn {
  error: AppError | null;
  isRetrying: boolean;
  clearError: () => void;
  handleError: (error: Error, context?: ErrorContext) => void;
  retryLastAction: () => Promise<void>;
  showError: (error: AppError) => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const { t } = useTranslation();
  const [error, setError] = useState<AppError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastAction, setLastAction] = useState<(() => Promise<void>) | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setLastAction(null);
  }, []);

  const getLocalizedErrorMessage = useCallback((error: AppError): string => {
    switch (error.type) {
      case 'network':
        return t('error.network');
      case 'permission':
        return t('error.location');
      case 'location':
        return t('error.locationMessage');
      case 'api':
        return t('error.server');
      case 'timeout':
        return 'リクエストがタイムアウトしました。もう一度お試しください。';
      default:
        return error.message || t('error.general');
    }
  }, [t]);

  const handleError = useCallback((
    error: Error,
    context?: ErrorContext
  ) => {
    console.error('Error handled:', error, context);

    const errorType = getErrorType(error);
    const appError = createError(
      errorType,
      getLocalizedErrorMessage(createError(errorType, error.message)),
      {
        code: (error as any).code,
        details: {
          ...context,
          originalMessage: error.message,
          stack: error.stack
        },
        recoverable: errorType !== 'permission'
      }
    );

    setError(appError);

    // アナリティクスにエラーを送信（実装済みの場合）
    if (context) {
      // analyticsPort.track('error_occurred', {
      //   error_type: errorType,
      //   component: context.component,
      //   action: context.action
      // });
    }
  }, [getLocalizedErrorMessage]);

  const showError = useCallback((appError: AppError) => {
    setError({
      ...appError,
      message: getLocalizedErrorMessage(appError)
    });
  }, [getLocalizedErrorMessage]);

  const retryLastAction = useCallback(async () => {
    if (!lastAction || !error?.recoverable) return;

    setIsRetrying(true);
    try {
      await lastAction();
      clearError();
    } catch (err) {
      console.error('Retry failed:', err);
      // エラーは既存のハンドラーで処理される
    } finally {
      setIsRetrying(false);
    }
  }, [lastAction, error, clearError]);

  const executeWithRetry = useCallback(async (
    action: () => Promise<void>,
    context?: ErrorContext
  ) => {
    setLastAction(() => action);
    try {
      await action();
    } catch (err) {
      handleError(err as Error, context);
    }
  }, [handleError]);

  return {
    error,
    isRetrying,
    clearError,
    handleError,
    retryLastAction,
    showError
  };
}