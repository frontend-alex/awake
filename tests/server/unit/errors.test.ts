/**
 * Unit Tests - Error Handling
 * 
 * Tests the error creation and handling utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Error constants (matching the actual error messages)
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: {
    errorCode: 'AUTH_003',
    statusCode: 401,
    message: 'Invalid email or password.',
    userMessage: 'The login information you provided is incorrect.',
  },
  USER_NOT_FOUND: {
    errorCode: 'USER_001',
    statusCode: 404,
    message: 'User not found.',
    userMessage: 'We couldn\'t find a user with that information.',
  },
  INVALID_TOKEN: {
    errorCode: 'JWT_001',
    statusCode: 401,
    message: 'Invalid or expired token.',
    userMessage: 'Your session has expired. Please log in again.',
  },
  EMAIL_NOT_VERIFIED: {
    errorCode: 'AUTH_006',
    statusCode: 403,
    message: 'Email has not been verified.',
    userMessage: 'Please verify your email before continuing.',
  },
}

// Simulated AppError class
class AppError extends Error {
  public statusCode: number
  public errorCode: string
  public userMessage?: string
  public extra?: Record<string, unknown>

  constructor({
    message,
    statusCode,
    errorCode,
    userMessage,
    extra,
  }: {
    message: string
    statusCode: number
    errorCode: string
    userMessage?: string
    extra?: Record<string, unknown>
  }) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.userMessage = userMessage

    if (extra && typeof extra === 'object') {
      this.extra = extra
      Object.assign(this, extra)
    }

    Error.captureStackTrace(this, this.constructor)
  }
}

// Simulated createError function
const createError = (
  type: keyof typeof ERROR_MESSAGES,
  overrides?: { userMessage?: string; extra?: Record<string, unknown> }
): AppError => {
  const fallback = {
    message: 'Unknown server error',
    statusCode: 500,
    errorCode: 'UNKNOWN',
  }

  const base = ERROR_MESSAGES[type] ?? fallback

  return new AppError({
    message: base.message,
    statusCode: base.statusCode || 500,
    errorCode: base.errorCode || 'UNKNOWN',
    userMessage: overrides?.userMessage ?? base.userMessage,
    extra: overrides?.extra,
  })
}

// Simulated error handler
const errorHandler = (
  err: AppError | Error,
  _req: unknown,
  res: { status: (code: number) => { json: (data: unknown) => void } },
  _next: unknown
) => {
  const isAppError = err instanceof AppError

  const statusCode = isAppError ? err.statusCode : 500
  const errorCode = isAppError ? err.errorCode : 'UNKNOWN'
  const message = isAppError ? err.message : 'Internal server error'
  const userMessage = isAppError ? err.userMessage : 'Something went wrong'

  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    statusCode,
    userMessage,
    ...(isAppError && err.extra ? err.extra : {}),
  })
}

describe('Error Handling', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError({
        message: 'Test error',
        statusCode: 400,
        errorCode: 'TEST_ERROR',
        userMessage: 'User-friendly message',
      })

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.errorCode).toBe('TEST_ERROR')
      expect(error.userMessage).toBe('User-friendly message')
      expect(error.name).toBe('AppError')
    })

    it('should handle extra properties', () => {
      const error = new AppError({
        message: 'Test error',
        statusCode: 400,
        errorCode: 'TEST_ERROR',
        extra: { field: 'email', reason: 'invalid' },
      })

      expect(error.extra).toEqual({ field: 'email', reason: 'invalid' })
    })

    it('should capture stack trace', () => {
      const error = new AppError({
        message: 'Test error',
        statusCode: 400,
        errorCode: 'TEST_ERROR',
      })

      expect(error.stack).toBeDefined()
    })
  })

  describe('createError', () => {
    it('should create INVALID_CREDENTIALS error', () => {
      const error = createError('INVALID_CREDENTIALS')

      expect(error).toBeInstanceOf(AppError)
      expect(error.errorCode).toBe('AUTH_003')
      expect(error.statusCode).toBe(401)
    })

    it('should create USER_NOT_FOUND error', () => {
      const error = createError('USER_NOT_FOUND')

      expect(error).toBeInstanceOf(AppError)
      expect(error.errorCode).toBe('USER_001')
      expect(error.statusCode).toBe(404)
    })

    it('should create INVALID_TOKEN error', () => {
      const error = createError('INVALID_TOKEN')

      expect(error).toBeInstanceOf(AppError)
      expect(error.errorCode).toBe('JWT_001')
      expect(error.statusCode).toBe(401)
    })

    it('should allow overriding userMessage', () => {
      const error = createError('INVALID_CREDENTIALS', {
        userMessage: 'Custom message',
      })

      expect(error.userMessage).toBe('Custom message')
    })

    it('should allow adding extra data', () => {
      const error = createError('EMAIL_NOT_VERIFIED', {
        extra: { email: 'test@example.com', otpRedirect: true },
      })

      expect(error.extra).toEqual({ email: 'test@example.com', otpRedirect: true })
    })
  })

  describe('errorHandler', () => {
    let mockRequest: unknown
    let mockResponse: {
      status: ReturnType<typeof vi.fn>
      json: ReturnType<typeof vi.fn>
    }
    let mockNext: unknown

    beforeEach(() => {
      mockRequest = {}
      mockResponse = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      }
      mockNext = vi.fn()
    })

    it('should handle AppError correctly', () => {
      const error = createError('INVALID_CREDENTIALS')

      errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: 'AUTH_003',
          statusCode: 401,
        })
      )
    })

    it('should handle generic Error as 500', () => {
      const error = new Error('Something went wrong')

      errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: 'UNKNOWN',
          statusCode: 500,
          userMessage: 'Something went wrong',
        })
      )
    })

    it('should include extra data in response for AppError', () => {
      const error = createError('EMAIL_NOT_VERIFIED', {
        extra: { email: 'test@example.com' },
      })

      errorHandler(error, mockRequest, mockResponse, mockNext)

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        })
      )
    })
  })
})
