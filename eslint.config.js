const { flatConfig } = require('./lib/index.js')

/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = [
  ...flatConfig,
  {
    ignores: ['lib'],
  },
]
