/**
 * Error Handling Utilities
 * Standardized error handling and logging
 */

import { MESSAGES } from '../constants';

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return MESSAGES.ERROR.GENERIC;
};

/**
 * Log error to console (can be extended to send to error tracking service)
 */
export const logError = (error: unknown, context?: Record<string, any>): void => {
  console.error('[Error]', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Handle API error and return user-friendly message
 */
export const handleApiError = (error: unknown, defaultMessage: string = MESSAGES.ERROR.GENERIC): string => {
  logError(error);
  return getErrorMessage(error) || defaultMessage;
};

/**
 * Check if error is network-related
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    );
  }
  return false;
};

/**
 * Create a safe async wrapper that handles errors
 */
export const safeAsync = async <T>(
  promise: Promise<T>,
  errorMessage?: string
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    const message = handleApiError(error, errorMessage);
    return { data: null, error: message };
  }
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
};
