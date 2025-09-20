import { ReactNode, useCallback } from 'react'

export interface ErrorInfo {
  message: string
  code?: string
  details?: string
}

interface ErrorHandlerProps {
  onError?: (error: ErrorInfo) => void
  fallback?: (error: ErrorInfo) => ReactNode
  children: ReactNode
}

export function ErrorHandler({ onError, fallback, children }: ErrorHandlerProps) {
  const handleError = useCallback((error: unknown) => {
    const errorInfo: ErrorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: error instanceof Error && 'code' in error ? String(error.code) : undefined,
      details: error instanceof Error ? error.stack : String(error)
    }

    console.error('Error caught by ErrorHandler:', errorInfo)

    if (onError) {
      onError(errorInfo)
    }

    return errorInfo
  }, [onError])

  try {
    return <>{children}</>
  } catch (error) {
    const errorInfo = handleError(error)

    if (fallback) {
      return <>{fallback(errorInfo)}</>
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              エラーが発生しました
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{errorInfo.message}</p>
              {errorInfo.code && (
                <p className="mt-1 text-xs">エラーコード: {errorInfo.code}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export function useErrorHandler() {
  return useCallback((error: unknown, context?: string) => {
    const errorInfo: ErrorInfo = {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      code: error instanceof Error && 'code' in error ? String(error.code) : undefined,
      details: context ? `${context}: ${error}` : String(error)
    }

    console.error('Error handled:', errorInfo)
    return errorInfo
  }, [])
}

export function withErrorHandler<T extends object>(
  Component: React.ComponentType<T>,
  errorFallback?: (error: ErrorInfo) => ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorHandler fallback={errorFallback}>
        <Component {...props} />
      </ErrorHandler>
    )
  }
}