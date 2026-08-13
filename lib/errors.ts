// lib/errors.ts
/**
 * Error handling and safe error responses
 * Ensures we never expose sensitive information to clients
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public isPublic: boolean = false
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Public error messages - safe to show to clients
export const PUBLIC_ERRORS = {
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: 'Authentication required', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: 'Access denied', status: 403 },
  NOT_FOUND: { code: 'NOT_FOUND', message: 'Resource not found', status: 404 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: 'Invalid input', status: 400 },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: 'An error occurred', status: 500 },
  DUPLICATE_CHECKIN: { code: 'DUPLICATE_CHECKIN', message: 'Already checked in', status: 409 },
  RATE_LIMIT: { code: 'RATE_LIMIT', message: 'Too many requests', status: 429 },
} as const

export function createPublicError(errorKey: keyof typeof PUBLIC_ERRORS) {
  const error = PUBLIC_ERRORS[errorKey]
  return new AppError(error.code, error.status, error.message, true)
}

export function isSafeToSend(error: Error | AppError): error is AppError {
  return error instanceof AppError && error.isPublic
}

export function getSafeErrorResponse(error: Error | AppError) {
  if (isSafeToSend(error)) {
    return {
      success: false,
      code: error.code,
      message: error.message,
    }
  }

  // Don't expose internal error details
  console.error('Internal error:', error)
  return {
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An error occurred',
  }
}

// For logging/debugging (server-side only)
export function logError(error: Error | AppError, context?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  const message = error instanceof AppError ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : 'No stack trace'

  console.error(
    JSON.stringify({
      timestamp,
      level: 'ERROR',
      message,
      stack,
      context,
      isAppError: error instanceof AppError,
    })
  )
}
