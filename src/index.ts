import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import { Linter } from 'eslint'

import { config } from '@/config'
// import path from 'path'
// import { fileURLToPath } from 'url'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

/**
 * This is a custom ESLint configuration. It extends the recommended ESLint configuration and adds some custom rules.
 *
 * @author Leandro Matos
 * @see {@link https://github.com/leandromatos/eslint-config GitHub} for more information.
 */
export const flatConfig: Linter.FlatConfig[] = [...compat.config(config)]
