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
    // Generated declarations, plus fixture trees the spec suite lints on its own terms:
    // `invalid` is deliberately broken, and `boundaries` exists to be walked, so neither
    // belongs to a tsconfig project the type-checked layer could read.
    ignores: ['coverage', 'src/*.d.ts', 'fixtures/invalid', 'fixtures/boundaries'],
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
