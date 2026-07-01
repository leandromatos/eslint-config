import js from '@eslint/js'
import markdown from '@eslint/markdown'
import prettier from 'eslint-config-prettier'
import importX from 'eslint-plugin-import-x'
import jsonc from 'eslint-plugin-jsonc'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const jsFiles = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}']
const tsFiles = ['**/*.{ts,tsx,mts,cts}']
const tsxFiles = ['**/*.tsx']
const jsonFiles = ['**/*.{json,jsonc,json5}']
const markdownFiles = ['**/*.md']

/**
 * Shared ESLint flat configuration.
 *
 * @author Leandro Matos
 * @see {@link https://github.com/leandromatos/eslint-config GitHub} for more information.
 * @type {import('eslint').Linter.Config[]}
 */
export default tseslint.config(
  {
    files: jsFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      'import-x': importX,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...js.configs.recommended.rules,
      curly: ['error', 'multi'],
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'import-x/no-duplicates': ['error', { considerQueryString: true, 'prefer-inline': false }],
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/no-relative-packages': 'error',
      'import-x/no-relative-parent-imports': 'error',
      'import-x/no-unresolved': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['.*/*'],
              message: 'Use absolute imports with @ alias instead of relative imports',
            },
          ],
        },
      ],
      'no-undef': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'padding-line-between-statements': ['error', { blankLine: 'always', next: 'return', prev: '*' }],
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
      'arrow-body-style': ['error', 'as-needed'],
      'object-shorthand': ['error', 'always'],
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
    },
  },
  {
    files: tsFiles,
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-exports': ['error', { fixMixedExportsWithInlineTypeSpecifier: true }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { disallowTypeAnnotations: false, fixStyle: 'separate-type-imports', prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unused-expressions': ['warn', { allowShortCircuit: true, allowTernary: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: tsxFiles,
    extends: [react.configs.flat.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: true,
          shorthandFirst: false,
          shorthandLast: true,
          multiline: 'last',
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  ...jsonc.configs['flat/recommended-with-jsonc'].map(config =>
    config.files ? config : { ...config, files: jsonFiles },
  ),
  ...jsonc.configs['flat/prettier'].map(config => (config.files ? config : { ...config, files: jsonFiles })),
  ...markdown.configs.recommended,
  {
    files: markdownFiles,
    rules: {
      'markdown/no-missing-label-refs': 'off',
    },
  },
  prettier,
)
