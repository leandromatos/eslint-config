/**
 * @type {import('lint-staged').Config}
 */
module.exports = {
  '*.js': () => 'yarn lint',
}
