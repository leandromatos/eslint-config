const { config } = require('./lib/index.js')

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = [
  ...config,
  {
    ignores: ['lib'],
  },
]
