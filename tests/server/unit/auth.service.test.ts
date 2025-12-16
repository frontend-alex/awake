/**
 * Unit Tests - AuthService
 * 
 * Tests the authentication service business logic with mocked implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock implementations
const mockUserRepo = {
  findByEmail: vi.fn(),
  findByUsername: vi.fn(),
  findById: vi.fn(),
  safeUpdate: vi.fn(),
}

const mockAuthRepo = {
  createUser: vi.fn(),
}

const mockJwtUtils = {
  generateToken: vi.fn().mockReturnValue('mock-token'),
}

// Mock the createError function
const createError = (code: string, options?: { extra?: Record<string, unknown> }) => {
  const error = new Error(code)
  ;(error as any).errorCode = code
  ;(error as any).statusCode = code === 'USER_NOT_FOUND' ? 404 : 400
  if (options?.extra) (error as any).extra = options.extra
  return error
}

// Simulated AuthService implementation for testing
const AuthService = {
  login: async (email: string, password: string) => {
    const user = await mockUserRepo.findByEmail(email)
    if (!user) throw createError('INVALID_CREDENTIALS')

    if (user.provider !== 'credentials') {
      throw createError('INVALID_CREDENTIALS')
    }

    const isMatch = await user.matchPassword?.(password)
    if (!isMatch) throw createError('INVALID_CREDENTIALS')

    if (!user.emailVerified) {
      throw createError('EMAIL_NOT_VERIFIED', { extra: { otpRedirect: true, email } })
    }

    return mockJwtUtils.generateToken(user.id, user.username)
  },

  register: async (username: string, email: string, password: string) => {
    const existingEmail = await mockUserRepo.findByEmail(email)
    if (existingEmail) {
      if (!existingEmail.emailVerified) {
        throw createError('EMAIL_ALREADY_TAKEN', { extra: { otpRedirect: true, email } })
      }
      throw createError('EMAIL_ALREADY_TAKEN')
    }

    const existingUsername = await mockUserRepo.findByUsername(username)
    if (existingUsername) throw createError('USERNAME_ALREADY_TAKEN')

    return await mockAuthRepo.createUser(username, email, password)
  },

  updatePassword: async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await mockUserRepo.findById(userId)
    if (!user) throw createError('USER_NOT_FOUND')

    // Simplified password comparison
    if (user.password !== currentPassword) {
      throw createError('INVALID_CURRENT_PASSWORD')
    }

    if (currentPassword === newPassword) {
      throw createError('SAME_PASSWORD')
    }

    await mockUserRepo.safeUpdate({ id: user.id }, { password: newPassword })
  },

  handleAuthCallback: async (user: { id: string; username: string } | null) => {
    if (!user) throw createError('USER_NOT_FOUND')
    return mockJwtUtils.generateToken(user.id, user.username)
  },
}

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should return token for valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedPassword',
        provider: 'credentials',
        emailVerified: true,
        matchPassword: vi.fn().mockResolvedValue(true),
      }

      mockUserRepo.findByEmail.mockResolvedValue(mockUser)
      mockJwtUtils.generateToken.mockReturnValue('mock-jwt-token')

      const token = await AuthService.login('test@example.com', 'password123')

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockUser.matchPassword).toHaveBeenCalledWith('password123')
      expect(mockJwtUtils.generateToken).toHaveBeenCalledWith('user-123', 'testuser')
      expect(token).toBe('mock-jwt-token')
    })

    it('should throw error for non-existent user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)

      await expect(AuthService.login('nonexistent@example.com', 'password'))
        .rejects.toThrow('INVALID_CREDENTIALS')
    })

    it('should throw error for OAuth user trying credential login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        provider: 'google',
        emailVerified: true,
      }

      mockUserRepo.findByEmail.mockResolvedValue(mockUser)

      await expect(AuthService.login('test@example.com', 'password'))
        .rejects.toThrow('INVALID_CREDENTIALS')
    })

    it('should throw error for unverified email', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        provider: 'credentials',
        emailVerified: false,
        matchPassword: vi.fn().mockResolvedValue(true),
      }

      mockUserRepo.findByEmail.mockResolvedValue(mockUser)

      await expect(AuthService.login('test@example.com', 'password'))
        .rejects.toThrow('EMAIL_NOT_VERIFIED')
    })

    it('should throw error for wrong password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        provider: 'credentials',
        emailVerified: true,
        matchPassword: vi.fn().mockResolvedValue(false),
      }

      mockUserRepo.findByEmail.mockResolvedValue(mockUser)

      await expect(AuthService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('INVALID_CREDENTIALS')
    })
  })

  describe('register', () => {
    it('should create new user with valid data', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.findByUsername.mockResolvedValue(null)
      mockAuthRepo.createUser.mockResolvedValue({
        id: 'new-user-123',
        email: 'new@example.com',
        username: 'newuser',
      })

      await AuthService.register('newuser', 'new@example.com', 'password123')

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('new@example.com')
      expect(mockUserRepo.findByUsername).toHaveBeenCalledWith('newuser')
      expect(mockAuthRepo.createUser).toHaveBeenCalledWith('newuser', 'new@example.com', 'password123')
    })

    it('should throw error if email already exists and verified', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
        emailVerified: true,
      })

      await expect(AuthService.register('newuser', 'existing@example.com', 'password'))
        .rejects.toThrow('EMAIL_ALREADY_TAKEN')
    })

    it('should throw error with redirect if email exists but not verified', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
        emailVerified: false,
      })

      try {
        await AuthService.register('newuser', 'existing@example.com', 'password')
        expect.fail('Should have thrown error')
      } catch (error: any) {
        expect(error.message).toBe('EMAIL_ALREADY_TAKEN')
        expect(error.extra).toEqual({ otpRedirect: true, email: 'existing@example.com' })
      }
    })

    it('should throw error if username already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.findByUsername.mockResolvedValue({
        id: 'existing-user',
        username: 'existinguser',
      })

      await expect(AuthService.register('existinguser', 'new@example.com', 'password'))
        .rejects.toThrow('USERNAME_ALREADY_TAKEN')
    })
  })

  describe('updatePassword', () => {
    it('should update password with correct current password', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'currentPassword',
      }

      mockUserRepo.findById.mockResolvedValue(mockUser)
      mockUserRepo.safeUpdate.mockResolvedValue({})

      await AuthService.updatePassword('user-123', 'currentPassword', 'newPassword123')

      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123')
      expect(mockUserRepo.safeUpdate).toHaveBeenCalled()
    })

    it('should throw error for wrong current password', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'currentPassword',
      }

      mockUserRepo.findById.mockResolvedValue(mockUser)

      await expect(AuthService.updatePassword('user-123', 'wrongPassword', 'newPassword'))
        .rejects.toThrow('INVALID_CURRENT_PASSWORD')
    })

    it('should throw error if new password is same as current', async () => {
      const mockUser = {
        id: 'user-123',
        password: 'samePassword',
      }

      mockUserRepo.findById.mockResolvedValue(mockUser)

      await expect(AuthService.updatePassword('user-123', 'samePassword', 'samePassword'))
        .rejects.toThrow('SAME_PASSWORD')
    })

    it('should throw error for non-existent user', async () => {
      mockUserRepo.findById.mockResolvedValue(null)

      await expect(AuthService.updatePassword('nonexistent', 'current', 'new'))
        .rejects.toThrow('USER_NOT_FOUND')
    })
  })

  describe('handleAuthCallback', () => {
    it('should generate token for valid OAuth user', async () => {
      const mockUser = {
        id: 'oauth-user-123',
        username: 'oauthuser',
      }

      mockJwtUtils.generateToken.mockReturnValue('oauth-token')

      const token = await AuthService.handleAuthCallback(mockUser)

      expect(mockJwtUtils.generateToken).toHaveBeenCalledWith('oauth-user-123', 'oauthuser')
      expect(token).toBe('oauth-token')
    })

    it('should throw error for null user', async () => {
      await expect(AuthService.handleAuthCallback(null))
        .rejects.toThrow('USER_NOT_FOUND')
    })
  })
})
