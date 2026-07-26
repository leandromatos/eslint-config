import config from './src/index.js'

/**
 * ESLint configuration for this repository, consuming the package's own config.
 *
 * @see {@link https://eslint.org/docs/latest/use/configure/configuration-files ESLint Configuration}
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  ...config,
  {
    ignores: ['coverage', 'src/index.d.ts'],
  },
  {
    files: ['eslint.config.mjs'],
    rules: {
      'import-x/no-relative-parent-imports': 'off',
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['fixtures/**/*.ts', 'fixtures/**/*.tsx'],
    rules: {
      'import-x/no-relative-parent-imports': 'off',
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/__tests__/**/*.js'],
    rules: {
      'import-x/no-relative-parent-imports': 'off',
      'no-restricted-imports': 'off',
    },
  },
]
