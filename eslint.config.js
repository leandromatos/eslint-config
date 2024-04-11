import config from './lib/index.js'

/**
 * @type {import('eslint').Linter.Config}
 */
export default [
  ...config,
  {
    ignores: ['lib'],
  },
]
