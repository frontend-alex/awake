/**
 * Unit Tests - Auth Middleware (JWT)
 * 
 * Tests the JWT authentication middleware logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

const TEST_SECRET = 'test-jwt-secret'

// Mock error creation
const createError = (code: string) => {
  const error = new Error(code)
  ;(error as any).statusCode = 401
  ;(error as any).errorCode = code
  return error
}

// Simulated JWT middleware for testing
const createJwtMiddleware = () => {
  return (
    req: { cookies?: { access_token?: string }; user?: { id: string; username: string } },
    _res: unknown,
    next: (error?: unknown) => void
  ) => {
    const token = req.cookies?.access_token

    if (!token) {
      return next(createError('INVALID_TOKEN'))
    }

    try {
      const decoded = jwt.verify(token, TEST_SECRET) as { id?: string; username?: string }

      if (!decoded?.id) {
        return next(createError('INVALID_TOKEN'))
      }

      req.user = {
        id: decoded.id,
        username: decoded.username || '',
      }

      next()
    } catch {
      next(createError('INVALID_TOKEN'))
    }
  }
}

describe('JWT Auth Middleware', () => {
  const jwtMiddleware = createJwtMiddleware()
  let mockRequest: { cookies?: { access_token?: string }; user?: { id: string; username: string } }
  let mockResponse: unknown
  let mockNext: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequest = {
      cookies: {},
    }
    mockResponse = {}
    mockNext = vi.fn()
  })

  it('should call next with error when no token provided', () => {
    mockRequest.cookies = {}

    jwtMiddleware(mockRequest, mockResponse, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(mockNext.mock.calls[0][0]).toBeDefined()
    expect((mockNext.mock.calls[0][0] as Error).message).toBe('INVALID_TOKEN')
  })

  it('should call next with error when token is invalid', () => {
    mockRequest.cookies = { access_token: 'invalid-token' }

    jwtMiddleware(mockRequest, mockResponse, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect((mockNext.mock.calls[0][0] as Error).message).toBe('INVALID_TOKEN')
  })

  it('should set user on request and call next for valid token', () => {
    const token = jwt.sign(
      { id: 'user-123', username: 'testuser' },
      TEST_SECRET
    )
    mockRequest.cookies = { access_token: token }

    jwtMiddleware(mockRequest, mockResponse, mockNext)

    expect(mockRequest.user).toEqual({
      id: 'user-123',
      username: 'testuser',
    })
    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should call next with error for expired token', () => {
    const token = jwt.sign(
      { id: 'user-123', username: 'testuser' },
      TEST_SECRET,
      { expiresIn: '-1h' } // Already expired
    )
    mockRequest.cookies = { access_token: token }

    jwtMiddleware(mockRequest, mockResponse, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect((mockNext.mock.calls[0][0] as Error).message).toBe('INVALID_TOKEN')
  })

  it('should call next with error when token has wrong secret', () => {
    const token = jwt.sign(
      { id: 'user-123', username: 'testuser' },
      'wrong-secret'
    )
    mockRequest.cookies = { access_token: token }

    jwtMiddleware(mockRequest, mockResponse, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect((mockNext.mock.calls[0][0] as Error).message).toBe('INVALID_TOKEN')
  })

  it('should call next with error when token payload is missing id', () => {
    const token = jwt.sign(
      { username: 'testuser' }, // Missing id
      TEST_SECRET
    )
    mockRequest.cookies = { access_token: token }

    jwtMiddleware(mockRequest, mockResponse, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect((mockNext.mock.calls[0][0] as Error).message).toBe('INVALID_TOKEN')
  })
})
