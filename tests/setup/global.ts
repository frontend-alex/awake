/**
 * Global test setup - runs for ALL test environments
 * 
 * This file configures:
 * - Global test utilities
 * - Common mocks
 * - Environment variables for testing
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest'

// Set test environment variables
process.env.NODE_ENV = 'test'

// Global setup
beforeAll(() => {
  // Silence console during tests (optional - comment out for debugging)
  // vi.spyOn(console, 'log').mockImplementation(() => {})
  // vi.spyOn(console, 'warn').mockImplementation(() => {})
  // vi.spyOn(console, 'error').mockImplementation(() => {})
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Global teardown
afterAll(() => {
  vi.restoreAllMocks()
})

