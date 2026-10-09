import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { TestingExtension, TierVocabulary } from '../types/index.js'
import {
  DEFAULT_FOLDERLESS_SUFFIXES,
  DEFAULT_TEST_KIND,
  DEFAULT_VOCABULARY,
  MODULE_SUFFIX,
} from './defaults.constant.js'
import { NEXTJS_ARCHITECTURE, REACT_ROOT_CONTEXTS, REACT_SUFFIX_FREE_FOLDERS } from './nextjs.constant.js'
import { TSX_SOURCES } from './sources.constant.js'

/** The files a React Native project's rules judge: its sources, and the local Expo modules under `modules/`. */
export const EXPO_FILES = [...TSX_SOURCES, 'modules/**/*.{ts,tsx}']

/**
 * The on-device catalog under `.rnstorybook/`, which React Native keeps beside `src/`. The rules that judge every line
 * of code read it; the rules that judge where a file sits and what it is called do not, since Storybook names its
 * entry files.
 */
export const EXPO_CATALOG_FILES = ['.rnstorybook/**/*.{ts,tsx}']

/**
 * What a React Native project never reads: what Expo and the catalog write, and what the native builds leave behind.
 *
 * A project that runs none of them ignores a directory that never appears, which costs it nothing.
 */
export const EXPO_IGNORES = [
  '**/.expo',
  '**/android',
  '**/ios',
  '**/expo-env.d.ts',
  '**/.rnstorybook/storybook.requires.ts',
]

/** The rules that judge where a file sits, what it is called, and which layer it reaches through a barrel. */
export const LAYOUT_RULES = [
  'architecture-barrel-per-directory',
  'architecture-import-boundaries',
  'architecture-known-directory',
  'architecture-known-suffix',
  'architecture-mirrored-source',
  'architecture-one-export-per-util',
  'architecture-type-suffix',
  'architecture-types-folder',
]

/** What sits at the root of the sources and answers to no module: the roots of any React tree. */
export const EXPO_ROOT_CONTEXTS = REACT_ROOT_CONTEXTS

/** The router names its own files, and a component is named after the function in it. */
export const EXPO_SUFFIX_FREE_FOLDERS = REACT_SUFFIX_FREE_FOLDERS

/**
 * Maestro closes the name of a flow with its kind, and a local Expo module is the file named after its directory. A
 * story is a web idea: React Native renders its catalog as an application rather than as a page.
 */
export const EXPO_FOLDERLESS_SUFFIXES = [...DEFAULT_FOLDERLESS_SUFFIXES, DEFAULT_TEST_KIND.e2e, MODULE_SUFFIX]

/**
 * The Worklets Babel plugin turns a `'worklet'` function into a factory called where the function is declared, with
 * the closure it reads handed over then: whatever a worklet calls is read at that moment, so it is declared above it.
 */
export const EXPO_DEFINITION_TIME_DIRECTIVES = ['worklet']

/**
 * The tree a React Native project writes.
 *
 * The same tree a Next.js project writes, because the architecture is the same one: modules under a container, a
 * component named after the function in it, and the router naming its own files. What differs is the platform. Every
 * field the tier changes is one of the constants above; the others are the ones of `nextjs`.
 */
export const EXPO_ARCHITECTURE: ArchitectureOptions = {
  ...NEXTJS_ARCHITECTURE,
  rootContexts: EXPO_ROOT_CONTEXTS,
  suffixFreeFolders: EXPO_SUFFIX_FREE_FOLDERS,
  folderlessSuffixes: EXPO_FOLDERLESS_SUFFIXES,
  definitionTimeDirectives: EXPO_DEFINITION_TIME_DIRECTIVES,
}

/**
 * How a spec of a React Native project reaches the application. An end-to-end run installs a built app on an emulator
 * and drives it from the outside, with flows written in the runner's own format, so no kind goes through HTTP.
 */
export const EXPO_TESTING: TestingExtension = {}

/** Everything `expo` judges with when a project says nothing. */
export const EXPO_VOCABULARY: TierVocabulary = {
  ...DEFAULT_VOCABULARY,
  files: EXPO_FILES,
  ignores: EXPO_IGNORES,
  architecture: EXPO_ARCHITECTURE,
  testing: EXPO_TESTING,
}
