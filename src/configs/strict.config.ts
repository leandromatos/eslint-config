import jsdoc from 'eslint-plugin-jsdoc'

import { leandromatos, plugin as ownPlugin } from '../plugins/index.js'
import type { TsdocOptions } from '../plugins/tsdoc/types/index.js'
import {
  DEFAULT_ARCHITECTURE,
  DEFAULT_NAMING,
  DEFAULT_TESTING,
  DEFAULT_TEXT,
  DEFAULT_TSDOC,
  DEFAULT_TYPESCRIPT,
} from './constants/index.js'
import { recommended } from './recommended.config.js'
import type { Config, StrictOptions } from './types/index.js'

/** The files a project's rules judge when it names none. */
const DEFAULT_FILES = ['src/**/*.ts']

/**
 * Every framework-agnostic rule of this package, on, with the personal conventions as its vocabulary.
 *
 * This is what a TypeScript project on these conventions takes: the shared configuration, the import boundaries, and
 * the six plugins that read no framework. A project states only where it differs: the folders of its own root, the
 * words it owns, the strings its product ships. What it never restates is the vocabulary itself, which is why the
 * import boundaries and the architecture rules cannot disagree here: both read the same map.
 * @param strictOptions - What this project says on top of the defaults.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const strict = (strictOptions: StrictOptions = {}): Config[] => {
  const files = strictOptions.files ?? DEFAULT_FILES
  const namingOptions = { ...DEFAULT_NAMING, ...strictOptions.naming }
  const tsdocOptions = { ...DEFAULT_TSDOC, ...strictOptions.tsdoc }
  const architectureOptions = { ...DEFAULT_ARCHITECTURE, ...strictOptions.architecture }
  const testingOptions = { ...DEFAULT_TESTING, ...strictOptions.testing }
  const textOptions = { ...DEFAULT_TEXT, ...strictOptions.text }
  const typescriptOptions = { ...DEFAULT_TYPESCRIPT, ...strictOptions.typescript }

  return [
    ...recommended({ ignores: strictOptions.ignores }),
    leandromatos(
      {
        architecture: architectureOptions,
        naming: namingOptions,
        testing: testingOptions,
        text: textOptions,
        tsdoc: tsdocOptions,
        typescript: typescriptOptions,
      },
      files,
    ),
    documentation(files),
    notes(tsdocOptions),
    cycles(files),
  ]
}

/**
 * What `eslint-plugin-jsdoc` holds, which is the half of a documentation comment this package does not.
 *
 * A comment lists every parameter and, when something comes back, what it is; a function returning void carries no
 * `@returns`, so a missing tag never means a forgotten one. Every description starts with a capital and ends with a
 * period, in TSDoc syntax.
 *
 * @param files - The files the rules judge.
 * @returns The configuration entry.
 */
const documentation = (files: string[]): Config => ({
  files,
  plugins: { jsdoc },
  // `@typeParam` is the TSDoc spelling; the plugin's TypeScript preference is `@template`.
  settings: { jsdoc: { mode: 'typescript', tagNamePreference: { template: 'typeParam' } } },
  rules: {
    'jsdoc/check-param-names': ['error', { checkDestructured: false }],
    'jsdoc/check-tag-names': ['error', { typed: true }],
    'jsdoc/match-description': ['error', { tags: { param: true, returns: true, throws: true } }],
    'jsdoc/no-types': 'error',
    /*
     * Reported and not fixed. The fixer writes the tag and leaves the description empty, which trades one finding
     * for two: the empty tag then fails `require-param-description`, and a reader is handed a comment that says
     * the parameter's name and nothing else.
     */
    'jsdoc/require-param': ['error', { checkDestructured: false, checkDestructuredRoots: false, enableFixer: false }],
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-returns-check': 'error',
    'jsdoc/require-returns-description': 'error',
  },
})

/**
 * The comment rule, reaching the files the type-aware layer leaves alone.
 *
 * A note is written the same way wherever it is written, and the rule reads none of the types, so it also judges the
 * configuration of the tools.
 *
 * @param tsdocOptions - The column a comment is wrapped at.
 * @returns The configuration entry.
 */
const notes = (tsdocOptions: TsdocOptions): Config => ({
  files: ['*.mts', '*.mjs'],
  plugins: { leandromatos: ownPlugin },
  rules: { 'leandromatos/tsdoc-comment-form': ['error', tsdocOptions] },
})

/**
 * The one import question a path cannot answer: whether two files reach each other.
 *
 * A barrel re-exports its siblings, so it sits in a cycle by design and is left out.
 *
 * `ignoreExternal` keeps the walk inside the project. A cycle between two files of a dependency is
 * not the project's to break, and reaching one means parsing what the dependency ships: React
 * Native's entry point is Flow, which the parser answers with the whole file on the terminal.
 *
 * @param files - The files the rule judges.
 * @returns The configuration entry.
 */
const cycles = (files: string[]): Config => ({
  files,
  ignores: ['**/index.{ts,tsx}'],
  rules: { 'import-x/no-cycle': ['error', { maxDepth: 2, ignoreExternal: true }] },
})
