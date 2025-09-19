export type ErrorType =
  | 'network'
  | 'permission'
  | 'location'
  | 'api'
  | 'timeout'
  | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  timestamp: number;
  recoverable: boolean;
}

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  location?: string;
}

export interface RetryOptions {
  maxAttempts: number;
  backoffMs: number;
  exponential: boolean;
}

export const createError = (
  type: ErrorType,
  message: string,
  options: {
    code?: string;
    details?: Record<string, any>;
    recoverable?: boolean;
  } = {}
): AppError => ({
  type,
  message,
  code: options.code,
  details: options.details,
  timestamp: Date.now(),
  recoverable: options.recoverable ?? true
});

export const isNetworkError = (error: Error): boolean => {
  return error.message.includes('fetch') ||
         error.message.includes('network') ||
         error.message.includes('ERR_NETWORK');
};

export const isTimeoutError = (error: Error): boolean => {
  return error.message.includes('timeout') ||
         error.message.includes('aborted');
};

export const getErrorType = (error: Error): ErrorType => {
  if (isNetworkError(error)) return 'network';
  if (isTimeoutError(error)) return 'timeout';
  if (error.message.includes('permission')) return 'permission';
  if (error.message.includes('location')) return 'location';
  if (error.message.includes('API')) return 'api';
  return 'unknown';
};