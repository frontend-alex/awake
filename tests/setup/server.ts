/**
 * Server test setup - Node.js environment
 * 
 * This file configures:
 * - Database mocks
 * - Environment variable overrides
 * - Express middleware mocking
 */

import { vi, beforeAll, afterAll } from 'vitest'

// Set server test environment variables
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.PORT = '0' // Random port for testing
  process.env.HOST = 'localhost'
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only'
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-for-testing-only'
  process.env.SESSION_SECRET = 'test-session-secret'
  process.env.DATABASE_URL = 'mongodb://localhost:27017/test-db'
})

// Mock database connection by default
vi.mock('@server/config/db', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
  disconnectDB: vi.fn().mockResolvedValue(undefined),
}))

// Mock logger to prevent console noise
vi.mock('@server/api/application/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

afterAll(() => {
  vi.restoreAllMocks()
})

