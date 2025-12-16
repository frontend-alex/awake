/**
 * Integration test setup
 * 
 * This file configures:
 * - Full application context
 * - Real service instances (with mocked I/O)
 * - Contract validation
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Set integration test environment
beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.PORT = '0'
  process.env.HOST = 'localhost'
  process.env.JWT_SECRET = 'integration-test-jwt-secret'
  process.env.JWT_REFRESH_SECRET = 'integration-test-jwt-refresh-secret'
  process.env.SESSION_SECRET = 'integration-test-session-secret'
})

// Mock external services but keep internal logic real
vi.mock('@server/config/db', () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
  disconnectDB: vi.fn().mockResolvedValue(undefined),
}))

// Mock email service for integration tests
vi.mock('@server/infrastructure/email/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  sendOtpEmail: vi.fn().mockResolvedValue({ success: true }),
  sendResetPasswordEmail: vi.fn().mockResolvedValue({ success: true }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

afterAll(() => {
  vi.restoreAllMocks()
})

