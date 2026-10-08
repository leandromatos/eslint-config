import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { TestingOptions } from '../../plugins/testing/types/index.js'
import { DEFAULT_TESTING } from './defaults.constant.js'
import { NEXTJS_ARCHITECTURE } from './nextjs.constant.js'
import { TSX_SOURCES } from './sources.constant.js'

/**
 * The files a React Native project's rules judge: its sources, the local Expo modules under `modules/`, and the
 * catalog under `.rnstorybook/`. Each is code the project writes, and React Native keeps the last two beside `src/`.
 */
export const EXPO_FILES = [...TSX_SOURCES, 'modules/**/*.{ts,tsx}', '.rnstorybook/**/*.{ts,tsx}']

/**
 * The files of {@link EXPO_FILES} that keep a layout of their own: the catalog, whose entry files Storybook names. The
 * rules that judge every line of code read them; the rules that judge where a file sits and what it is called do not.
 *
 * A local Expo module is laid out like any package: its `src/` follows the layout of the house, and what sits beside
 * it, the entry and the mock, carries no `src` and so meets only the rules of code and comments.
 */
export const EXPO_UNLAID_FILES = ['.rnstorybook/**/*.{ts,tsx}']

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

/**
 * What a React Native project never reads: what Expo and the catalog write, and what the native builds leave behind.
 *
 * A project that runs none of them ignores a directory that never appears, which costs it nothing.
 */
export const EXPO_IGNORED = [
  '**/.expo',
  '**/android',
  '**/ios',
  '**/expo-env.d.ts',
  '**/.rnstorybook/storybook.requires.ts',
]

/**
 * The tree a React Native project writes here.
 *
 * The same tree a Next project writes, because the architecture is the same one: modules under a container, a
 * component named after the function in it, and the router naming its own files. What differs is the platform. A
 * screen has no document, so there is no `app` styling and no catalog of one; a storage is the device's, which
 * the web reaches through a cookie; and Expo Router names the files under `app` the way the App Router does.
 */
export const EXPO_ARCHITECTURE: ArchitectureOptions = {
  ...NEXTJS_ARCHITECTURE,
  suffixToFolder: {
    ...NEXTJS_ARCHITECTURE.suffixToFolder,
    /* The device's own store, which a web project reaches through a cookie instead. */
    storage: 'storages',
  },
  /*
   * `tools` holds modules inside a feature, the way `features` holds them at the root: an editor is a feature, and
   * each tool of it is a module of its own, with its own components and hooks.
   */
  moduleContainers: [...NEXTJS_ARCHITECTURE.moduleContainers, 'tools'],
  /* What sits at the root of the sources and answers to no module: the router, the assets, the theme. */
  rootContexts: ['app', 'assets', 'constants', 'hooks', 'theme', 'types', 'utils'],
  /* The router names its own files, and a component is named after the function in it. */
  suffixFreeFolders: ['app', 'components'],
  /* A story is a web idea: React Native renders its catalog as an application rather than as a page. */
  folderlessSuffixes: [...NEXTJS_ARCHITECTURE.folderlessSuffixes].filter(suffix => suffix !== 'stories'),
  /*
   * The Worklets Babel plugin turns a `'worklet'` function into a factory called where the function is declared, with
   * the closure it reads handed over then: whatever a worklet calls is read at that moment, so it is declared above it.
   */
  definitionTimeDirectives: ['worklet'],
}

/**
 * How a React Native project writes a spec.
 *
 * An end-to-end run installs a built app on an emulator and drives it from the outside, with flows written in the
 * runner's own format rather than in TypeScript. There is no request and no client to import, so the kind is left
 * unnamed and the rule that asks for one stays quiet.
 */
export const EXPO_TESTING: TestingOptions = {
  ...DEFAULT_TESTING,
  suffixToFolder: EXPO_ARCHITECTURE.suffixToFolder,
  httpTest: { kind: '', client: '' },
}
