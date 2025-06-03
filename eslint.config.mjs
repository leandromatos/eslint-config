import { config } from './lib/index.js'

/**
 * ESLint configuration using flat config format.
 *
 * @see {@link https://eslint.org/docs/latest/use/configure/configuration-files-new ESLint Configuration}
 */
export default [
  ...config,
  {
    ignores: ['lib'],
  },
]
