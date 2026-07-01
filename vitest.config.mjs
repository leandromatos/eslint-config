import { defineConfig } from 'vitest/config'

/**
 * @type {import('vitest/config').UserConfig}
 */
export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    reporters: ['verbose'],
  },
})
