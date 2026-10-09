import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { HttpTest } from '../../plugins/testing/types/index.js'
import type { DictionarySuffix, TestingExtension, TierVocabulary } from '../types/index.js'
import {
  DEFAULT_ARCHITECTURE,
  DEFAULT_FOLDERLESS_SUFFIXES,
  DEFAULT_MIRROR_FOLDERS,
  DEFAULT_SUFFIX_TO_FOLDER,
  DEFAULT_TEST_KIND,
  DEFAULT_VOCABULARY,
} from './defaults.constant.js'
import { TSX_SOURCES } from './sources.constant.js'
import { AGNOSTIC_SUFFIX_DICTIONARY, REACT_SUFFIX_DICTIONARY } from './suffix-dictionary.constant.js'

/** The files a React project's rules judge, which is its components as much as its modules. */
export const NEXTJS_FILES = TSX_SOURCES

/**
 * What a Next.js project never reads.
 *
 * Every entry is written by a tool rather than by a person: the framework's build and its ambient types, the
 * directory it serves untouched, the catalog's build, and what a run against a browser leaves behind. A project that
 * runs none of them ignores a directory that never appears, which costs it nothing.
 */
export const NEXTJS_IGNORES = [
  '**/.next',
  '**/next-env.d.ts',
  '**/playwright-report',
  '**/public',
  '**/storybook-static',
  '**/test-results',
]

/** The components Next.js and Expo render an image with, which `jsx-a11y/alt-text` reads as an `<img>`. */
export const REACT_IMAGE_COMPONENTS = ['Image']

/**
 * The folders a React tree names that hold no layer: the router, the assets, the containers of modules, the code only
 * the server runs, and the catalog.
 */
export const REACT_FOLDER = {
  assets: 'assets',
  features: 'features',
  libs: 'libs',
  router: 'app',
  server: 'server',
  storybook: 'storybook',
}

/** What closes the name of a story, which sits beside the component it shows. */
export const STORY_SUFFIX = 'stories'

/** Every file named by the layer it belongs to: the agnostic layers, and the ones a React tree adds. */
export const NEXTJS_SUFFIX_TO_FOLDER: Record<string, string> = {
  ...DEFAULT_SUFFIX_TO_FOLDER,
  ...REACT_SUFFIX_DICTIONARY,
}

/**
 * The directories that hold modules: `features` and `libs`, where the layer of a file starts one segment later, and
 * `scripts`, whose build-time scripts import from the sources, each a context with layers of its own.
 */
export const NEXTJS_MODULE_CONTAINERS = [REACT_FOLDER.features, REACT_FOLDER.libs, AGNOSTIC_SUFFIX_DICTIONARY.script]

/**
 * The hooks React needs to synchronize with something outside itself. Named rather than banned outright, because the
 * documentation of React says an effect is how that synchronization is written; what the rules decide is where it is
 * written.
 */
export const NEXTJS_EFFECT_HOOKS = ['useEffect', 'useLayoutEffect', 'useInsertionEffect']

/** The router names its own files, and a component is named after the function in it, on the web and on a device. */
export const REACT_SUFFIX_FREE_FOLDERS = [REACT_FOLDER.router, AGNOSTIC_SUFFIX_DICTIONARY.component]

/** What sits at the root of the sources of any React tree and answers to no module: the router, the shared layers. */
export const REACT_ROOT_CONTEXTS = [
  ...REACT_SUFFIX_FREE_FOLDERS,
  REACT_FOLDER.assets,
  AGNOSTIC_SUFFIX_DICTIONARY.constant,
  REACT_SUFFIX_DICTIONARY.hook,
  AGNOSTIC_SUFFIX_DICTIONARY.type,
  AGNOSTIC_SUFFIX_DICTIONARY.util,
]

/** The roots of a React tree, with the providers, the styles and the catalog a web application keeps there. */
export const NEXTJS_ROOT_CONTEXTS = [
  ...REACT_ROOT_CONTEXTS,
  AGNOSTIC_SUFFIX_DICTIONARY.provider,
  REACT_SUFFIX_DICTIONARY.style,
  REACT_FOLDER.storybook,
]

/** `server` mirrors the layers it holds, the way `types` does, and holds what only the server may run. */
export const NEXTJS_MIRROR_FOLDERS = [...DEFAULT_MIRROR_FOLDERS, REACT_FOLDER.server]

/** The folders of a React tree that name their own files, with the catalog, whose files Storybook names. */
export const NEXTJS_SUFFIX_FREE_FOLDERS = [...REACT_SUFFIX_FREE_FOLDERS, REACT_FOLDER.storybook]

/**
 * Playwright names the files that set a run up, the kind closes the name of a spec it runs, and a story sits beside
 * the component it shows rather than in a folder of its own.
 */
export const NEXTJS_FOLDERLESS_SUFFIXES = [...DEFAULT_FOLDERLESS_SUFFIXES, DEFAULT_TEST_KIND.e2e, STORY_SUFFIX]

/** The layers of a React tree a list names, by the suffix of their files. */
export const REACT_LAYER = {
  component: 'component',
  hook: 'hook',
  provider: 'provider',
  screen: 'screen',
  store: 'store',
} satisfies Record<string, DictionarySuffix>

/** What a component, a hook or a store takes is read beside it. */
export const NEXTJS_CO_LOCATED_TYPE_SUFFIXES = Object.values(REACT_LAYER)

/** The catalog loads a story and the application never does, so a story may build its props from a testing entry. */
export const NEXTJS_DEVELOPMENT_SUFFIXES = [STORY_SUFFIX]

/**
 * The tree a React project writes.
 *
 * A module of this tree sits under a container rather than at the root of the sources, a component is named after
 * the function in it rather than by a suffix, and what a component takes is declared beside it. Every field the tier
 * changes is one of the constants above; the others are the defaults.
 */
export const NEXTJS_ARCHITECTURE: ArchitectureOptions = {
  ...DEFAULT_ARCHITECTURE,
  suffixToFolder: NEXTJS_SUFFIX_TO_FOLDER,
  moduleContainers: NEXTJS_MODULE_CONTAINERS,
  effectHooks: NEXTJS_EFFECT_HOOKS,
  rootContexts: NEXTJS_ROOT_CONTEXTS,
  mirrorFolders: NEXTJS_MIRROR_FOLDERS,
  suffixFreeFolders: NEXTJS_SUFFIX_FREE_FOLDERS,
  folderlessSuffixes: NEXTJS_FOLDERLESS_SUFFIXES,
  coLocatedTypeSuffixes: NEXTJS_CO_LOCATED_TYPE_SUFFIXES,
  developmentSuffixes: NEXTJS_DEVELOPMENT_SUFFIXES,
}

/** The runner an end-to-end spec of a React project drives a browser with. */
export const NEXTJS_HTTP_CLIENT = '@playwright/test'

/**
 * An end-to-end run of a React project goes through the browser, so the client a spec of that kind imports is the
 * runner that drives one rather than a client of HTTP.
 */
export const NEXTJS_HTTP_TEST: HttpTest = { kind: DEFAULT_TEST_KIND.e2e, client: NEXTJS_HTTP_CLIENT }

/** How a spec of a React project reaches the application. */
export const NEXTJS_TESTING: TestingExtension = {
  httpTest: NEXTJS_HTTP_TEST,
}

/** Everything `nextjs` judges with when a project says nothing. */
export const NEXTJS_VOCABULARY: TierVocabulary = {
  ...DEFAULT_VOCABULARY,
  files: NEXTJS_FILES,
  ignores: NEXTJS_IGNORES,
  architecture: NEXTJS_ARCHITECTURE,
  testing: NEXTJS_TESTING,
}
