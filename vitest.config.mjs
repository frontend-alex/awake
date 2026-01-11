import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      // Server aliases (for server tests)
      '@server': resolve(fileURLToPath(new URL('./app/server/src', import.meta.url))),
      // Shared aliases
      '@shared': resolve(fileURLToPath(new URL('./packages/shared/src', import.meta.url))),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', 'build'],
    deps: {
      interopDefault: true,
      moduleDirectories: [
        'node_modules',
        'app/server/node_modules',
        'packages/shared/node_modules',
      ],
    },
  },
})
