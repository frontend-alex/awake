/**
 * Global Test Setup
 * 
 * Configures testing environment for both client and server tests
 */

import '@testing-library/jest-dom'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'

// Set test environment
process.env.NODE_ENV = 'test'

// Mock console to reduce noise in tests (optional)
// Uncomment if you want to silence logs during tests
// vi.spyOn(console, 'log').mockImplementation(() => {})
// vi.spyOn(console, 'warn').mockImplementation(() => {})
// vi.spyOn(console, 'error').mockImplementation(() => {})

// Global test utilities
beforeAll(() => {
  // Any global setup before all tests
})

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks()
})

afterAll(() => {
  // Any global teardown after all tests
  vi.restoreAllMocks()
})
