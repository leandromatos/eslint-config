import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import markdown from '@eslint/markdown'
import type { Linter } from 'eslint'

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
    'prettier/prettier': [
      'error',
      {
        arrowParens: 'avoid',
        overrides: [
          {
            files: ['*.yml', '*.yaml'],
            options: {
              singleQuote: false,
            },
          },
        ],
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
      files: ['**/*.ts', '**/*.tsx'],
      extends: ['plugin:@typescript-eslint/recommended', 'plugin:@typescript-eslint/recommended-type-checked'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: true,
      },
      plugins: ['@typescript-eslint'],
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.d.ts'],
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
      files: ['**/*.tsx'],
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
          '@typescript-eslint/parser': ['.ts', '.d.ts', '.tsx'],
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
            overrides: [
              {
                files: ['*.yml', '*.yaml'],
                options: {
                  singleQuote: false,
                },
              },
            ],
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
 * This is a custom ESLint configuration. It extends the recommended ESLint configuration and adds some custom rules.
 *
 * @author Leandro Matos
 * @see {@link https://github.com/leandromatos/eslint-config GitHub} for more information.
 */
export const config: Linter.Config[] = [
  {
    ignores: ['**/*.md'],
  },
  ...compat.config(legacyConfig),
  ...(markdown.configs.recommended as Linter.Config[]),
  {
    files: ['**/*.md'],
    rules: {
      'markdown/no-html': 'off',
    },
  },
]
