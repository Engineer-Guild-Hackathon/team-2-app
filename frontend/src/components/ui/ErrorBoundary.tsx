import React, { Component, ReactNode } from 'react';
import { AppError, createError } from '../../types/errors';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = createError(
      'unknown',
      'アプリケーションでエラーが発生しました',
      {
        details: {
          originalMessage: error.message,
          stack: error.stack
        },
        recoverable: true
      }
    );

    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: AppError;
  retry: () => void;
}

function DefaultErrorFallback({ error, retry }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="text-6xl mb-4" role="img" aria-label="エラー">
            😵
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            申し訳ございません
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message}
          </p>
        </div>

        <div className="space-y-4">
          {error.recoverable && (
            <button
              onClick={retry}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              再試行
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            ページを再読み込み
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <details>
            <summary className="cursor-pointer hover:text-gray-700">
              エラー詳細
            </summary>
            <div className="mt-2 p-3 bg-gray-100 rounded text-left">
              <p><strong>タイプ:</strong> {error.type}</p>
              <p><strong>時刻:</strong> {new Date(error.timestamp).toLocaleString()}</p>
              {error.code && <p><strong>コード:</strong> {error.code}</p>}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}