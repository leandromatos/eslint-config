import js from '@eslint/js'
import markdown from '@eslint/markdown'
import stylistic from '@stylistic/eslint-plugin'
import type { Linter } from 'eslint'
import { defineConfig } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import importX, { createNodeResolver } from 'eslint-plugin-import-x'
import jsonc from 'eslint-plugin-jsonc'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import {
  JS_FILES,
  JSON_FILES,
  MARKDOWN_FILES,
  RECOMMENDED_IGNORES,
  RECOMMENDED_RESTRICTED_SYNTAX,
  TS_FILES,
  TSX_FILES,
} from './constants/index.js'
import { MissingPluginConfigError } from './errors/index.js'
import type { Config, RecommendedOptions } from './types/index.js'
import { extendList } from './utils/index.js'

/**
 * Shared ESLint flat configuration: one object per file type, and Prettier last.
 *
 * The tier every other one is built on, and the one a project on no framework takes by itself. It judges every file
 * a project holds rather than its sources alone, so what a project says here is what the linter never reads.
 *
 * @param recommendedOptions - What this project says on top of the defaults.
 * @returns The configuration, to export from `eslint.config.mts`.
 * @see {@link https://github.com/leandromatos/eslint-config | GitHub} for more information.
 */
export const recommended = (recommendedOptions: RecommendedOptions = {}): Config[] =>
  defineConfig(
    { ignores: extendList(RECOMMENDED_IGNORES, recommendedOptions.ignores) },
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
      /*
       * What an import spelling resolves to, and what the plugin may open once it has.
       *
       * Both halves are needed and neither is the default. Node's own resolution answers a bare package and a
       * relative path carrying an extension, and nothing else: an alias is a TypeScript setting and an extensionless
       * import is a TypeScript convention. And a plugin that resolves a path still reads only the extensions it
       * knows, which out of the box are the JavaScript ones, so a walk of the import graph stops at the first
       * TypeScript file it reaches. Without both, the rules that follow imports see no edge inside a project.
       */
      settings: {
        ...importX.flatConfigs.typescript.settings,
        'import-x/resolver-next': [createTypeScriptImportResolver(), createNodeResolver()],
      },
      rules: {
        ...js.configs.recommended.rules,
        'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
        'import-x/no-duplicates': ['error', { considerQueryString: true, 'prefer-inline': false }],
        'import-x/no-extraneous-dependencies': 'off',
        'import-x/no-relative-packages': 'error',
        /*
         * Off: it reads an alias as a parent import.
         *
         * The rule resolves the spelling and reports whatever lands above the importing file, which every `@/`
         * alias does. `leandromatos/architecture-import-boundaries` asks the same question of the spelling the
         * author wrote, which is the one a reader sees.
         */
        'import-x/no-relative-parent-imports': 'off',
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
         * of a dependency runs against another at runtime. A builtin imported without its protocol loads whatever
         * package shares its name, and a catch whose body is a value leaves the same trace for every failure: none.
         * `no-restricted-imports` would say the second, and the boundaries layer takes that rule over inside the source
         * tree, so a selector says it.
         */
        'no-restricted-syntax': ['error', ...RECOMMENDED_RESTRICTED_SYNTAX],
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
      extends: [readReactFlatConfig('recommended'), reactHooks.configs.flat.recommended],
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
        'jsx-a11y/alt-text': ['warn', { elements: ['img'] }],
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
    ...jsonc.configs['flat/recommended-with-jsonc'].map(narrowToJsonFiles),
    ...jsonc.configs['flat/prettier'].map(narrowToJsonFiles),
    ...markdown.configs.recommended,
    {
      files: MARKDOWN_FILES,
      rules: {
        'markdown/no-missing-label-refs': 'off',
      },
    },
    prettier,
    /*
     * Prettier never adds or removes a brace, so `eslint-config-prettier` turns `curly` off and leaves the choice to
     * the configuration after it. `multi` is not one of the options its documentation lists as conflicting: a brace
     * wraps a body of two statements or more, and a single statement goes without one however many lines it spans.
     */
    {
      files: JS_FILES,
      rules: { curly: ['error', 'multi'] },
    },
  )

/**
 * Reads one of the React plugin's flat configurations, by name.
 *
 * The plugin declares them as an index signature, so every entry reads as optional; a name that is not there is a
 * version this configuration was not written against, and failing at load says so where a silent `undefined` would
 * drop the React rules.
 *
 * @param name - The configuration's name.
 * @returns The configuration.
 * @throws MissingPluginConfigError When the plugin declares no configuration under that name.
 */
const readReactFlatConfig = (name: 'recommended'): NonNullable<(typeof react.configs.flat)[string]> => {
  const reactFlatConfig = react.configs.flat?.[name]
  if (!reactFlatConfig) throw new MissingPluginConfigError('eslint-plugin-react', name)

  return reactFlatConfig
}

/**
 * Narrows one entry of the JSON plugin to this configuration's JSON files.
 *
 * The plugin's own entries name the files they apply to, and the ones that name none apply everywhere; those are the
 * ones this configuration narrows, so a JSON rule never reaches a TypeScript file.
 *
 * @param config - The plugin's entry.
 * @returns The entry, narrowed when it named no files.
 */
const narrowToJsonFiles = (config: Linter.Config): Linter.Config => {
  if (config.files) return config
  const narrowed = { ...config, files: JSON_FILES }

  return narrowed
}
