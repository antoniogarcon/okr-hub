/**
 * Standardized error handling utilities for the OKRs View application
 * Provides consistent error messages, types, and handling across the codebase
 */

import i18next from 'i18next';

/**
 * Error codes for the application
 */
export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  
  // Validation errors
  VALIDATION_REQUIRED = 'VALIDATION_REQUIRED',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_MIN_LENGTH = 'VALIDATION_MIN_LENGTH',
  VALIDATION_MAX_LENGTH = 'VALIDATION_MAX_LENGTH',
  
  // Data errors
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_CONFLICT = 'DATA_CONFLICT',
  DATA_INTEGRITY = 'DATA_INTEGRITY',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // Database errors
  DB_CONNECTION = 'DB_CONNECTION',
  DB_QUERY = 'DB_QUERY',
  DB_CONSTRAINT = 'DB_CONSTRAINT',
  
  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TENANT_MISMATCH = 'TENANT_MISMATCH',
  
  // General errors
  UNKNOWN = 'UNKNOWN',
  SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * Application error class with standardized structure
 */
export class AppError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;
  
  constructor(code: ErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message || getErrorMessage(code));
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Get translated error message for an error code
 */
export function getErrorMessage(code: ErrorCode, params?: Record<string, string>): string {
  const key = `errors.${code}`;
  const translated = i18next.t(key, params);
  
  // If translation not found, return a fallback
  if (translated === key) {
    return i18next.t('errors.UNKNOWN');
  }
  
  return translated;
}

/**
 * Parse Supabase error and return standardized AppError
 */
export function parseSupabaseError(error: unknown): AppError {
  if (!error) {
    return new AppError(ErrorCode.UNKNOWN);
  }

  // Handle Supabase error object
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    const message = (err.message as string) || '';
    const code = (err.code as string) || '';
    
    // Authentication errors
    if (message.includes('Invalid login credentials') || code === 'invalid_credentials') {
      return new AppError(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }
    
    if (message.includes('JWT expired') || code === 'jwt_expired') {
      return new AppError(ErrorCode.AUTH_SESSION_EXPIRED);
    }
    
    // RLS errors
    if (message.includes('row-level security') || code === '42501') {
      return new AppError(ErrorCode.PERMISSION_DENIED);
    }
    
    // Not found
    if (message.includes('not found') || code === 'PGRST116') {
      return new AppError(ErrorCode.DATA_NOT_FOUND);
    }
    
    // Constraint violation
    if (code === '23505' || message.includes('duplicate key')) {
      return new AppError(ErrorCode.DATA_CONFLICT);
    }
    
    if (code === '23503' || message.includes('foreign key')) {
      return new AppError(ErrorCode.DATA_INTEGRITY);
    }
    
    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return new AppError(ErrorCode.NETWORK_ERROR);
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (error.includes('401') || error.includes('unauthorized')) {
      return new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }
    if (error.includes('403') || error.includes('forbidden')) {
      return new AppError(ErrorCode.AUTH_FORBIDDEN);
    }
  }

  return new AppError(ErrorCode.UNKNOWN, String(error));
}

/**
 * Create user-friendly error message from any error
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof AppError) {
    return getErrorMessage(error.code);
  }
  
  const appError = parseSupabaseError(error);
  return getErrorMessage(appError.code);
}

/**
 * Log error with context (for debugging)
 * Does not expose sensitive information
 */
export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  const errorInfo = error instanceof Error 
    ? { name: error.name, message: error.message }
    : { type: typeof error };
  
  console.error(`[${timestamp}] [${context}]`, errorInfo);
}

/**
 * Validate required fields and return errors
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  
  for (const field of requiredFields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors[field] = i18next.t('errors.VALIDATION_REQUIRED', { field: String(field) }) as string;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Safe async handler wrapper for consistent error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context: string
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    logError(context, error);
    const appError = parseSupabaseError(error);
    return { data: null, error: appError };
  }
}
