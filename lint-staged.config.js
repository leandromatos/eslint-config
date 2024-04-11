/**
 * @type {import('lint-staged').Config}
 */
export default {
  '*.js': () => 'yarn lint',
}
