/**
 * Shared test utilities and helpers
 * 
 * Use these utilities across all test types to maintain consistency
 * and reduce boilerplate.
 */

import { vi } from 'vitest'

/**
 * Creates a mock Express request object
 */
export function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    user: null,
    get: vi.fn(),
    ...overrides,
  }
}

/**
 * Creates a mock Express response object
 */
export function createMockResponse() {
  const res: Record<string, unknown> = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  res.send = vi.fn().mockReturnValue(res)
  res.cookie = vi.fn().mockReturnValue(res)
  res.clearCookie = vi.fn().mockReturnValue(res)
  res.redirect = vi.fn().mockReturnValue(res)
  res.set = vi.fn().mockReturnValue(res)
  return res
}

/**
 * Creates a mock next function for Express middleware
 */
export function createMockNext() {
  return vi.fn()
}

/**
 * Wait for all promises to resolve (useful for async state updates)
 */
export async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * Creates a test user object with default values
 */
export function createTestUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

/**
 * Generates a mock JWT token for testing
 */
export function generateMockToken(payload = {}) {
  const defaultPayload = {
    id: 'test-user-id',
    username: 'testuser',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
  
  // This is a mock token structure - NOT a real JWT
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify({ ...defaultPayload, ...payload })).toString('base64url')
  const signature = 'mock-signature'
  
  return `${header}.${body}.${signature}`
}
