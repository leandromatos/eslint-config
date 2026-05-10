import { fixupConfigRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import markdownPlugin from '@eslint/markdown'
import type { Linter } from 'eslint'
import jsoncPlugin from 'eslint-plugin-jsonc'

const legacyConfig: Linter.LegacyConfig = {
  env: {
    es2024: true,
    jest: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['import', 'prettier', 'simple-import-sort'],
  root: true,
  rules: {
    curly: ['error', 'multi'],
    'func-style': [
      'error',
      'declaration',
      {
        allowArrowFunctions: true,
      },
    ],
    'import/no-duplicates': [
      'error',
      {
        considerQueryString: true,
        'prefer-inline': false,
      },
    ],
    'import/no-extraneous-dependencies': 'off',
    'import/no-relative-packages': 'error',
    'import/no-relative-parent-imports': 'error',
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
    'import/no-unresolved': 'off',
    'no-undef': 'off',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
      },
    ],
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        next: 'return',
        prev: '*',
      },
    ],
    'prefer-arrow-callback': [
      'error',
      {
        allowNamedFunctions: false,
        allowUnboundThis: true,
      },
    ],
    'arrow-body-style': ['error', 'as-needed'],
    'object-shorthand': ['error', 'always'],
    'prettier/prettier': [
      'error',
      {
        arrowParens: 'avoid',
        printWidth: 120,
        semi: false,
        singleQuote: true,
      },
    ],
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.mts', '*.cts'],
      extends: ['plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/recommended-type-checked'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: true,
      },
      plugins: ['@typescript-eslint'],
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx', '.mts', '.cts', '.d.ts'],
        },
      },
      rules: {
        '@typescript-eslint/consistent-type-exports': [
          'error',
          {
            fixMixedExportsWithInlineTypeSpecifier: true,
          },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            disallowTypeAnnotations: false,
            fixStyle: 'separate-type-imports',
            prefer: 'type-imports',
          },
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
        '@typescript-eslint/no-unused-expressions': [
          'warn',
          {
            allowShortCircuit: true,
            allowTernary: true,
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      files: ['*.tsx'],
      env: {
        browser: true,
      },
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['react', 'jsx-a11y'],
      settings: {
        react: {
          version: 'detect',
        },
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx', '.mts', '.cts', '.d.ts'],
        },
      },
      rules: {
        'jsx-a11y/alt-text': [
          'warn',
          {
            elements: ['img'],
            img: ['Image'],
          },
        ],
        'prettier/prettier': [
          'error',
          {
            arrowParens: 'avoid',
            printWidth: 120,
            semi: false,
            singleQuote: true,
            plugins: ['prettier-plugin-tailwindcss'],
            tailwindFunctions: ['tv', 'clsx', 'cva', 'tw'],
          },
        ],
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
  ],
}

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

/**
 * Apply a default `files` filter to flat config entries that don't already declare one.
 * Several upstream plugins (eslint-plugin-prettier, eslint-plugin-jsonc) register rules
 * globally, which causes them to crash when ESLint tries to apply them to files of other
 * languages (e.g. running JSON-AST rules on a .md file).
 */
const scopeIfNoFiles = (configs: Linter.Config[], files: string[]): Linter.Config[] =>
  configs.map(c => (c.files ? c : { ...c, files }))

const jsExtensions = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}']
const jsonExtensions = ['**/*.{json,jsonc,json5}']

/**
 * This is a custom ESLint configuration. It extends the recommended ESLint configuration and adds some custom rules.
 *
 * @author Leandro Matos
 * @see {@link https://github.com/leandromatos/eslint-config GitHub} for more information.
 */
export const config: Linter.Config[] = [
  ...scopeIfNoFiles(fixupConfigRules(compat.config(legacyConfig)), jsExtensions),
  ...scopeIfNoFiles(jsoncPlugin.configs['flat/recommended-with-jsonc'], jsonExtensions),
  ...scopeIfNoFiles(jsoncPlugin.configs['flat/prettier'], jsonExtensions),
  ...markdownPlugin.configs.recommended,
  {
    files: ['**/*.md'],
    rules: {
      'markdown/no-missing-label-refs': 'off',
    },
  },
]
