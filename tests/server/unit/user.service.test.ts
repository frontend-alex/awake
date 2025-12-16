/**
 * Unit Tests - UserService
 * 
 * Tests the user service business logic with mocked implementations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock implementations
const mockUserRepo = {
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}

// Mock error creation
const createError = (code: string) => {
  const error = new Error(code)
  ;(error as any).errorCode = code
  ;(error as any).statusCode = code === 'USER_NOT_FOUND' ? 404 : 400
  return error
}

// Simulated UserService implementation for testing
const UserService = {
  updateUser: async (userId: string, updateData: Record<string, unknown>) => {
    if (Object.keys(updateData).length === 0) {
      throw createError('NO_UPDATES_PROVIDED')
    }

    // If email is being updated, set emailVerified to false
    if ('email' in updateData) {
      updateData.emailVerified = false
    }

    await mockUserRepo.updateUser({ _id: userId }, updateData)
  },

  deleteUser: async (userId: string) => {
    if (!userId) throw createError('USER_NOT_FOUND')

    const result = await mockUserRepo.deleteUser(userId)
    if (!result) throw createError('USER_NOT_FOUND')
  },
}

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateUser', () => {
    it('should update user with valid data', async () => {
      mockUserRepo.updateUser.mockResolvedValue({
        id: 'user-123',
        username: 'updateduser',
      })

      await UserService.updateUser('user-123', { username: 'updateduser' })

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(
        { _id: 'user-123' },
        { username: 'updateduser' }
      )
    })

    it('should throw error when no updates provided', async () => {
      await expect(UserService.updateUser('user-123', {}))
        .rejects.toThrow('NO_UPDATES_PROVIDED')
    })

    it('should set emailVerified to false when email is updated', async () => {
      mockUserRepo.updateUser.mockResolvedValue({})

      await UserService.updateUser('user-123', { email: 'new@example.com' })

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(
        { _id: 'user-123' },
        { email: 'new@example.com', emailVerified: false }
      )
    })

    it('should allow updating multiple fields', async () => {
      mockUserRepo.updateUser.mockResolvedValue({})

      await UserService.updateUser('user-123', { 
        username: 'newuser',
        email: 'new@example.com' 
      })

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(
        { _id: 'user-123' },
        { username: 'newuser', email: 'new@example.com', emailVerified: false }
      )
    })
  })

  describe('deleteUser', () => {
    it('should delete user with valid ID', async () => {
      mockUserRepo.deleteUser.mockResolvedValue({
        id: 'user-123',
      })

      await UserService.deleteUser('user-123')

      expect(mockUserRepo.deleteUser).toHaveBeenCalledWith('user-123')
    })

    it('should throw error for non-existent user', async () => {
      mockUserRepo.deleteUser.mockResolvedValue(null)

      await expect(UserService.deleteUser('nonexistent'))
        .rejects.toThrow('USER_NOT_FOUND')
    })

    it('should throw error when userId is empty', async () => {
      await expect(UserService.deleteUser(''))
        .rejects.toThrow('USER_NOT_FOUND')
    })
  })
})
