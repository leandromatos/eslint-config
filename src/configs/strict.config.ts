import eslintComments from '@eslint-community/eslint-plugin-eslint-comments'
import tsdoc from 'eslint-plugin-tsdoc'

import type { ArchitectureOptions } from '../plugins/architecture/types/index.js'
import { buildPluginConfig, plugin as ownPlugin } from '../plugins/index.js'
import type { TestingOptions } from '../plugins/testing/types/index.js'
import type { TsdocOptions } from '../plugins/tsdoc/types/index.js'
import { DEFAULT_VOCABULARY, STRICT_RESTRICTED_SYNTAX } from './constants/index.js'
import { recommended } from './recommended.config.js'
import type { Config, StrictOptions, TierVocabulary } from './types/index.js'
import {
  applyPreset,
  assertKnownFolders,
  buildConstantEntry,
  buildValueSuffixEntries,
  extendArchitecture,
  extendList,
  extendNaming,
  extendText,
  extendTsdoc,
  extendTypescript,
  placeInPackage,
} from './utils/index.js'

/** The files a spec is written in, where a matcher of the test runner is typed `any` by design. */
const SPEC_FILES = ['**/*.{spec,test}.{ts,tsx}']

/** The files a React component is written in, which the React documentation declares with `function`. */
const COMPONENT_FILES = ['**/*.tsx']

/** The configuration files at the root of a repository, which the comment rule reads although no tier judges them. */
const ROOT_CONFIGURATION_FILES = ['*.{ts,mts,cts,js,mjs,cjs}']

/**
 * Every framework-agnostic rule of this package, on, with the agnostic vocabulary.
 *
 * This is what a TypeScript project on no framework takes: the shared configuration, the import boundaries, and the
 * plugins that read no framework. A project states only where it differs: the folders of its own root, the words it
 * owns, the strings its product ships. The import boundaries and the architecture rules read the same map, so they
 * cannot disagree.
 *
 * @param strictOptions - What this project says on top of the defaults.
 * @returns The configuration, to export from `eslint.config.mts`.
 */
export const strict = (strictOptions: StrictOptions = {}): Config[] =>
  buildStrictConfig(DEFAULT_VOCABULARY, strictOptions)

/**
 * Builds the strict layers over the vocabulary of a tier, with what the project says joined to it.
 *
 * Every tier is this function over its own vocabulary, so a field means the same thing whichever tier a project is
 * on. The presets the project takes are applied over that vocabulary first, then the project's own options. The test
 * folder and the test kinds are read from the architecture once and handed to every plugin that needs them.
 *
 * @param tierVocabulary - What the tier judges with when the project says nothing.
 * @param strictOptions - What this project says on top of it.
 * @returns The configuration.
 * @throws FolderVocabularyError When the folder vocabulary disagrees with the dictionary.
 */
export const buildStrictConfig = (tierVocabulary: TierVocabulary, strictOptions: StrictOptions): Config[] => {
  const { presets = [] } = strictOptions
  const vocabulary = presets.reduce(applyPreset, tierVocabulary)
  const files = extendList(vocabulary.files, strictOptions.files)
  const architectureOptions = extendArchitecture(vocabulary.architecture, strictOptions.architecture)
  assertKnownFolders(architectureOptions.suffixToFolder, strictOptions.architecture?.suffixDictionary)
  const testingOptions = buildTestingOptions(vocabulary, strictOptions, architectureOptions)
  const namingOptions = {
    ...extendNaming(vocabulary.naming, strictOptions.naming),
    testFolder: architectureOptions.testFolder,
  }
  const textOptions = extendText(vocabulary.text, strictOptions.text)
  const tsdocOptions = extendTsdoc(vocabulary.tsdoc, strictOptions.tsdoc)
  const typescriptOptions = extendTypescript(vocabulary.typescript, strictOptions.typescript)
  const ignores = extendList(vocabulary.ignores, strictOptions.ignores)
  const sharedLayers = selectSharedLayers(recommended({ ignores }), strictOptions.basePath)
  const ownLayers = [
    buildPluginConfig(
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
    buildDocumentationEntry(files),
    buildNotesEntry(tsdocOptions),
    buildCycleEntry(files),
    buildCastEntry(files),
    buildUnsafeValueEntry(files),
    buildDirectiveEntry(files),
    buildControlFlowEntry(files),
    buildFunctionStyleEntry(files),
    buildConstantEntry(vocabulary.constantFiles),
    ...buildValueSuffixEntries(files, vocabulary.valueSuffixes),
  ]

  return [...sharedLayers, ...placeInPackage(ownLayers, strictOptions.basePath)]
}

/**
 * Builds what the testing rules read: the test folder, the kinds, the map and the alias the architecture names, and the
 * HTTP kind the project or the tier names, when one does.
 *
 * @param vocabulary - What the tier judges with when the project says nothing.
 * @param strictOptions - What this project says on top of it.
 * @param architectureOptions - The architecture the project ends up with.
 * @returns The options the testing rules read.
 */
const buildTestingOptions = (
  vocabulary: TierVocabulary,
  strictOptions: StrictOptions,
  architectureOptions: ArchitectureOptions,
): TestingOptions => {
  const { testFolder, testKinds, mirroringTestKinds, suffixToFolder, alias } = architectureOptions
  const httpTest = strictOptions.testing?.httpTest ?? vocabulary.testing.httpTest
  const testingOptions: TestingOptions = {
    testFolder,
    testKinds,
    mirroringTestKinds,
    suffixToFolder,
    alias,
  }
  if (!httpTest) return testingOptions

  return { ...testingOptions, httpTest }
}

/**
 * Selects what a tier opens with: every layer of {@link recommended} for the repository, and only what ignores a
 * file for a package, whose root configuration carries the layers once for the whole repository.
 *
 * @param layers - The layers of {@link recommended}, which open with the entry that ignores what a tool writes.
 * @param basePath - The directory of the package, and nothing for the repository itself.
 * @returns The entries.
 */
const selectSharedLayers = (layers: Config[], basePath: string | undefined): Config[] => {
  if (!basePath) return layers

  return placeInPackage(layers.slice(0, 1), basePath)
}

/**
 * Builds the entry that holds a documentation comment to the grammar TSDoc defines.
 *
 * `eslint-plugin-tsdoc` parses every comment with the parser TSDoc publishes, so a tag outside the standard, a type in
 * braces or a name the grammar refuses is reported where it is written. What a comment has to say is the business of
 * the rules of this package; this is what it has to be written as.
 *
 * @param files - The files the rule judges.
 * @returns The configuration entry.
 */
const buildDocumentationEntry = (files: string[]): Config => {
  const documentationEntry: Config = {
    files,
    plugins: { tsdoc },
    rules: { 'tsdoc/syntax': 'error' },
  }

  return documentationEntry
}

/**
 * Builds the entry that takes the comment rule to the configuration files at the root, which the type-aware layer
 * leaves alone.
 *
 * A note is written the same way wherever it is written, and the rule reads none of the types, so it also judges the
 * configuration of the tools.
 *
 * @param tsdocOptions - The column a comment is wrapped at.
 * @returns The configuration entry.
 */
const buildNotesEntry = (tsdocOptions: TsdocOptions): Config => {
  const notesEntry: Config = {
    files: ROOT_CONFIGURATION_FILES,
    plugins: { leandromatos: ownPlugin },
    rules: { 'leandromatos/tsdoc-comment-form': ['error', tsdocOptions] },
  }

  return notesEntry
}

/**
 * Builds the entry for the one import question a path cannot answer: whether two files reach each other.
 *
 * A barrel re-exports its siblings, so it sits in a cycle by design and is left out. `ignoreExternal` keeps the walk
 * inside the project: a cycle between two files of a dependency is not the project's to break, and reaching one means
 * parsing what the dependency ships, such as the Flow of React Native's entry point.
 *
 * @param files - The files the rule judges.
 * @returns The configuration entry.
 */
const buildCycleEntry = (files: string[]): Config => {
  const cycleEntry: Config = {
    files,
    ignores: ['**/index.{ts,tsx}'],
    rules: { 'import-x/no-cycle': ['error', { maxDepth: 2, ignoreExternal: true }] },
  }

  return cycleEntry
}

/**
 * Builds the entry that admits no cast anywhere in the sources, specs included, and no `any` written by hand.
 *
 * A cast tells the compiler to stop checking, and a non-null assertion is a cast to a narrower type. A guard, a
 * generic or the type the library declares says the same thing and keeps the check. `as const` is no cast: it narrows
 * a literal to itself, and `satisfies` checks a value without changing its type, so both stay. An `any` annotation
 * stops the check the same way a cast does.
 *
 * @param files - The files the rules judge.
 * @returns The configuration entry.
 */
const buildCastEntry = (files: string[]): Config => {
  const castEntry: Config = {
    name: 'leandromatos/casts',
    files,
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  }

  return castEntry
}

/**
 * Builds the entry that lets no value typed `any` travel through the sources.
 *
 * `any` reaches the code through `JSON.parse`, `Reflect.getMetadata` or a dynamic import, and it stops at `unknown`,
 * where a guard narrows it. A spec is left out, because the asymmetric matchers of a test runner are typed `any` by
 * design.
 *
 * @param files - The files the rules judge.
 * @returns The configuration entry.
 */
const buildUnsafeValueEntry = (files: string[]): Config => {
  const unsafeValueEntry: Config = {
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
  }

  return unsafeValueEntry
}

/**
 * Builds the entry that asks every directive turning a rule off for its reason, after `--`.
 *
 * The one cast the sources admit is the one nothing else can replace, and the directive that lets it through is where
 * the reason is written, so the next reader checks the reason rather than guessing it.
 *
 * @param files - The files the rule judges.
 * @returns The configuration entry.
 */
const buildDirectiveEntry = (files: string[]): Config => {
  const directiveEntry: Config = {
    name: 'leandromatos/directives',
    files,
    plugins: { '@eslint-community/eslint-comments': eslintComments },
    rules: { '@eslint-community/eslint-comments/require-description': 'error' },
  }

  return directiveEntry
}

/**
 * Builds the entry that refuses the branches an early return replaces: an `else`, and a ternary everywhere but as the
 * direct child of a JSX expression, where React documents it for a choice between two elements.
 *
 * `no-restricted-syntax` takes one list, so the entry carries the refusals of `recommended` too. A ternary inside
 * another is refused in JSX as well, where the React documentation says to extract a component instead.
 *
 * @param files - The files the rules judge.
 * @returns The configuration entry.
 */
const buildControlFlowEntry = (files: string[]): Config => {
  const controlFlowEntry: Config = {
    name: 'leandromatos/control-flow',
    files,
    rules: {
      'no-restricted-syntax': ['error', ...STRICT_RESTRICTED_SYNTAX],
      'no-nested-ternary': 'error',
    },
  }

  return controlFlowEntry
}

/**
 * Builds the entry that writes every function as an arrow, outside the files that hold components.
 *
 * A component keeps the `function` the React documentation declares it with, for its name in a stack trace. The
 * signatures of an overload are declarations by necessity, and `func-style` leaves them alone.
 *
 * @param files - The files the rule judges.
 * @returns The configuration entry.
 */
const buildFunctionStyleEntry = (files: string[]): Config => {
  const functionStyleEntry: Config = {
    name: 'leandromatos/function-style',
    files,
    ignores: COMPONENT_FILES,
    rules: { 'func-style': ['error', 'expression'] },
  }

  return functionStyleEntry
}
