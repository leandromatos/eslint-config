import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})
import { Linter } from 'eslint'

export const config: Linter.Config = {
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
      },
    ],
    'import/no-extraneous-dependencies': 'off',
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
        prev: '*',
        next: 'return',
      },
    ],
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@typescript-eslint/recommended'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: true,
        // tsconfigRootDir: __dirname,
      },
      plugins: ['@typescript-eslint'],
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.d.ts'],
        },
      },
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'warn',
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
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
      },
    },
  ],
}

/**
 * This is a custom ESLint configuration. It extends the recommended ESLint configuration and adds some custom rules.
 *
 * @author Leandro Matos
 * @see {@link https://github.com/leandromatos/eslint-config GitHub} for more information.
 */
export default [...compat.config(config)]
