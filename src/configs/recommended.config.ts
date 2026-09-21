import js from '@eslint/js'
import markdown from '@eslint/markdown'
import stylistic from '@stylistic/eslint-plugin'
import type { Linter } from 'eslint'
import { defineConfig } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import importX from 'eslint-plugin-import-x'
import jsonc from 'eslint-plugin-jsonc'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import type { Config, RecommendedOptions } from './types/index.js'

/**
 * The modules Node ships, which a package of the same name shadows when the import carries no protocol.
 *
 * `node:` is what makes the builtin the one that loads, whatever a project installed.
 */
const NODE_BUILTINS = [
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'crypto',
  'dgram',
  'diagnostics_channel',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
]

const JS_FILES = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}']
const TS_FILES = ['**/*.{ts,tsx,mts,cts}']
const TSX_FILES = ['**/*.tsx']
const JSON_FILES = ['**/*.{json,jsonc,json5}']
const MARKDOWN_FILES = ['**/*.md']

/**
 * What every project ignores: what a build wrote, what a coverage run wrote, and what an agent works in.
 *
 * Each carries a leading glob so a monorepo is covered too: a bare name matches the root and nothing under a
 * package.
 */
const IGNORED = ['**/.claude', '**/coverage', '**/dist']

/**
 * Shared ESLint flat configuration: one object per file type, and Prettier last.
 *
 * The tier every other one is built on, and the one a project on no framework takes by itself. It judges every file
 * a project holds rather than its sources alone, so what a project says here is what the linter never reads.
 *
 * @param recommendedOptions - What this project says on top of the defaults.
 * @returns The configuration, to export from `eslint.config.mts`.
 * @author Leandro Matos
 * @see {@link https://github.com/leandromatos/eslint-config GitHub} for more information.
 */
export const recommended = (recommendedOptions: RecommendedOptions = {}): Config[] =>
  defineConfig(
    { ignores: [...IGNORED, ...(recommendedOptions.ignores ?? [])] },
    {
      files: JS_FILES,
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        /*
         * JSX is enabled for the whole base layer, not just for .tsx. The layer matches .jsx too, and the default
         * parser reads that syntax only with this on. The React rules stay on .tsx, so this makes the syntax
         * parseable everywhere the layer claims to apply and nothing more.
         */
        parserOptions: {
          ecmaFeatures: { jsx: true },
        },
        globals: {
          ...globals.node,
          ...globals.vitest,
        },
      },
      plugins: {
        '@stylistic': stylistic,
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
        // The type-checker reports an import that resolves to nothing, as TS2307, over the same files.
        'import-x/no-unresolved': 'off',
        /*
         * A type import is its own statement, never inline in a value import, which is what `consistent-type-imports`
         * writes when it fixes.
         */
        'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['.*/*'],
                message: 'Use absolute imports instead of relative imports.',
              },
            ],
          },
        ],
        'no-undef': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@stylistic/padding-line-between-statements': ['error', { blankLine: 'always', next: 'return', prev: '*' }],
        'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
        'arrow-body-style': ['error', 'as-needed'],
        'object-shorthand': ['error', 'always'],
        'simple-import-sort/exports': 'error',
        'simple-import-sort/imports': 'error',
      },
    },
    {
      files: TS_FILES,
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
        /*
         * An enum is the one TypeScript construct that emits runtime code with no JavaScript counterpart: Node's type
         * stripping cannot run it, a single-file transpiler cannot inline it, and a const enum inlined from one version
         * of a dependency runs against another at runtime. A closed set of values is an object `as const` and the type
         * derived from it, which is JavaScript and compares with the literal a payload carries.
         */
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message:
              'Declare a closed set of values as `const X = {...} as const` plus `type X = (typeof X)[keyof typeof X]`, never as an enum.',
          },
          /*
           * A catch whose body is a value answers every failure with that value: a network error and a refused
           * credential leave the same trace, which is none.
           */
          /*
           * `no-restricted-imports` is the rule for this, and the boundaries layer takes that rule over inside the
           * source tree. A selector reads the same import and no layer replaces it.
           */
          {
            selector: `ImportDeclaration[source.value=/^(${NODE_BUILTINS.join('|')})$/]`,
            message:
              'Import the builtin as `node:<name>`. Without the protocol, a package of that name takes its place.',
          },
          {
            selector:
              "CallExpression[callee.property.name='catch'] > ArrowFunctionExpression[body.type=/^(Literal|Identifier)$/]",
            message:
              'This catch answers every failure with one value. Await the call, catch the error, and narrow it to the one this code answers for.',
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
        '@typescript-eslint/no-unused-expressions': ['warn', { allowShortCircuit: true, allowTernary: true }],
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      files: TSX_FILES,
      extends: [reactFlatConfigOf('recommended'), reactHooks.configs.flat.recommended],
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
          version: '19.0',
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
    ...jsonc.configs['flat/recommended-with-jsonc'].map(onJsonFiles),
    ...jsonc.configs['flat/prettier'].map(onJsonFiles),
    ...markdown.configs.recommended,
    {
      files: MARKDOWN_FILES,
      rules: {
        'markdown/no-missing-label-refs': 'off',
      },
    },
    prettier,
  )

/**
 * One of the React plugin's flat configurations, by name.
 *
 * The plugin declares them as an index signature, so every entry reads as optional; a name that is not there is a
 * version this configuration was not written against, and failing at load says so where a silent `undefined` would
 * drop the React rules.
 *
 * @param name - The configuration's name.
 * @returns The configuration.
 * @throws Error When the plugin declares no configuration under that name.
 */
const reactFlatConfigOf = (name: string): NonNullable<(typeof react.configs.flat)[string]> => {
  const reactFlatConfig = react.configs.flat?.[name]
  /* v8 ignore next -- the plugin declares the configuration this package asks for; the throw is what says so when it stops */
  if (!reactFlatConfig) throw new Error(`eslint-plugin-react declares no flat configuration named "${name}"`)

  return reactFlatConfig
}

/**
 * One entry of the JSON plugin, aimed at this configuration's JSON files.
 *
 * The plugin's own entries name the files they apply to, and the ones that name none apply everywhere; those are the
 * ones this configuration narrows, so a JSON rule never reaches a TypeScript file.
 *
 * @param config - The plugin's entry.
 * @returns The entry, narrowed when it named no files.
 */
const onJsonFiles = (config: Linter.Config): Linter.Config => {
  if (config.files) return config

  return { ...config, files: JSON_FILES }
}
