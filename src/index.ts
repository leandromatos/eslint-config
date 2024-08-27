import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import { Linter } from 'eslint'

import { legacyConfig } from '@/config'

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
export const config: Linter.Config[] = [...compat.config(legacyConfig)]
