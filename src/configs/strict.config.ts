import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'
import tsdoc from 'eslint-plugin-tsdoc'

import { leandromatos, plugin as ownPlugin } from '../plugins/index.js'
import type { TsdocOptions } from '../plugins/tsdoc/types/index.js'
import {
  DEFAULT_ARCHITECTURE,
  DEFAULT_FILES,
  DEFAULT_NAMING,
  DEFAULT_TESTING,
  DEFAULT_TEXT,
  DEFAULT_TSDOC,
  DEFAULT_TYPESCRIPT,
} from './constants/index.js'
import { recommended } from './recommended.config.js'
import type { Config, StrictOptions } from './types/index.js'
import { assertKnownFolders, inPackage } from './utils/index.js'

/** The files a spec is written in, where a matcher of the test runner is typed `any` by design. */
const SPEC_FILES = ['**/*.spec.{ts,tsx}']

/**
 * Every framework-agnostic rule of this package, on, with the personal conventions as its vocabulary.
 *
 * This is what a TypeScript project on these conventions takes: the shared configuration, the import boundaries, and
 * the six plugins that read no framework. A project states only where it differs: the folders of its own root, the
 * words it owns, the strings its product ships. What it never restates is the vocabulary itself, which is why the
 * import boundaries and the architecture rules cannot disagree here: both read the same map.
 *
 * @param strictOptions - What this project says on top of the defaults.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const strict = (strictOptions: StrictOptions = {}): Config[] => {
  const files = strictOptions.files ?? DEFAULT_FILES
  const namingOptions = { ...DEFAULT_NAMING, ...strictOptions.naming }
  const tsdocOptions = { ...DEFAULT_TSDOC, ...strictOptions.tsdoc }
  const architectureOptions = { ...DEFAULT_ARCHITECTURE, ...strictOptions.architecture }
  assertKnownFolders(architectureOptions.suffixToFolder, architectureOptions.suffixDictionary)
  const testingOptions = { ...DEFAULT_TESTING, ...strictOptions.testing }
  const textOptions = { ...DEFAULT_TEXT, ...strictOptions.text }
  const typescriptOptions = { ...DEFAULT_TYPESCRIPT, ...strictOptions.typescript }

  const shared = sharedOf(recommended({ ignores: strictOptions.ignores }), strictOptions.basePath)
  const own = [
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
    casts(files),
    unsafeValues(files),
    directives(files),
  ]

  return [...shared, ...inPackage(own, strictOptions.basePath)]
}

/**
 * What a tier opens with: every layer of {@link recommended} for the repository, and only what ignores a file for a
 * package, whose root configuration carries the layers once for the whole repository.
 *
 * @param layers - The layers of {@link recommended}, which open with the entry that ignores what a tool writes.
 * @param basePath - The directory of the package, and nothing for the repository itself.
 * @returns The entries.
 */
const sharedOf = (layers: Config[], basePath: string | undefined): Config[] => {
  if (!basePath) return layers

  return inPackage(layers.slice(0, 1), basePath)
}

/**
 * The grammar of a documentation comment, as TSDoc defines it.
 *
 * `eslint-plugin-tsdoc` parses every comment with the parser TSDoc publishes, so a tag outside the standard, a type in
 * braces or a name the grammar refuses is reported where it is written. What a comment has to say is the business of
 * the rules of this package; this is what it has to be written as.
 *
 * @param files - The files the rule judges.
 * @returns The configuration entry.
 */
const documentation = (files: string[]): Config => ({
  files,
  plugins: { tsdoc },
  rules: { 'tsdoc/syntax': 'error' },
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

/**
 * No cast, anywhere in the sources, specs included.
 *
 * A cast tells the compiler to stop checking, and a non-null assertion is a cast to a narrower type. A guard, a
 * generic or the type the library declares says the same thing and keeps the check. `as const` is no cast: it narrows
 * a literal to itself, and `satisfies` checks a value without changing its type, so both stay.
 *
 * @param files - The files the rules judge.
 * @returns The configuration entry.
 */
const casts = (files: string[]): Config => ({
  name: 'leandromatos/casts',
  files,
  rules: {
    '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    '@typescript-eslint/no-non-null-assertion': 'error',
  },
})

/**
 * No value typed `any` travels through the sources.
 *
 * `any` reaches the code through `JSON.parse`, `Reflect.getMetadata` or a dynamic import, and it stops at `unknown`,
 * where a guard narrows it. A spec is left out, because the asymmetric matchers of a test runner are typed `any` by
 * design.
 *
 * @param files - The files the rules judge.
 * @returns The configuration entry.
 */
const unsafeValues = (files: string[]): Config => ({
  name: 'leandromatos/unsafe-values',
  files,
  ignores: SPEC_FILES,
  rules: {
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
  },
})

/**
 * Every directive that turns a rule off says why, after `--`.
 *
 * The one cast the sources admit is the one nothing else can replace, and the directive that lets it through is where
 * the reason is written, so the next reader checks the reason rather than guessing it.
 *
 * @param files - The files the rule judges.
 * @returns The configuration entry.
 */
const directives = (files: string[]): Config => ({
  name: 'leandromatos/directives',
  files,
  plugins: { '@eslint-community/eslint-comments': eslintComments },
  rules: { '@eslint-community/eslint-comments/require-description': 'error' },
})
