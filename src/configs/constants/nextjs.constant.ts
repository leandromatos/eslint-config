import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { TestingOptions } from '../../plugins/testing/types/index.js'
import type { TsdocOptions } from '../../plugins/tsdoc/types/index.js'
import { DEFAULT_ARCHITECTURE, DEFAULT_TESTING, DEFAULT_TSDOC, SUFFIX_TO_FOLDER } from './defaults.constant.js'

/** The files a React project's rules judge, which is its components as much as its modules. */
export const NEXTJS_FILES = ['src/**/*.{ts,tsx}']

/**
 * What a React project never reads.
 *
 * Every entry is written by a tool rather than by a person: the framework's build and its ambient types, the
 * directory it serves untouched, the catalogue's build, and what a run against a browser leaves behind. A project
 * that runs none of them ignores a directory that never appears, which costs it nothing.
 */
export const NEXTJS_IGNORED = [
  '**/.next',
  '**/lighthouse-report',
  '**/next-env.d.ts',
  '**/playwright-report',
  '**/public',
  '**/storybook-static',
  '**/test-results',
]

/** Where the catalogue lives, which is a development tool rather than a part of the application. */
export const STORYBOOK_FOLDER = 'storybook'

/** What closes the name of a story, which sits beside the component it shows. */
export const STORY_SUFFIX = 'stories'

/**
 * The tree a React project writes here.
 *
 * A module of this tree sits under a container rather than at the root of the sources, a component is named after
 * the function in it rather than by a suffix, and what a component takes is declared beside it. The router's own
 * files are named by the framework, so the folder that holds them says what they are.
 */
export const NEXTJS_ARCHITECTURE: ArchitectureOptions = {
  ...DEFAULT_ARCHITECTURE,
  suffixToFolder: {
    ...SUFFIX_TO_FOLDER,
    action: 'actions',
    component: 'components',
    hook: 'hooks',
    provider: 'providers',
    screen: 'screens',
    context: 'contexts',
    cookie: 'cookies',
    dictionary: 'dictionaries',
    style: 'styles',
    worker: 'workers',
  },
  /*
   * `features` and `libs` hold modules; the layer of a file starts one segment later. `modules` holds them inside
   * a lib, which is how a client is organised by the domain it calls: `libs/api/modules/packages/keys`.
   */
  moduleContainers: ['features', 'libs', 'modules'],
  /*
   * The hooks React needs to synchronize with something outside itself. Named rather than banned outright, because
   * the documentation of React says an effect is how that synchronization is written; what the rules decide is
   * where it is written.
   */
  effectHooks: ['useEffect', 'useLayoutEffect', 'useInsertionEffect'],
  /* A lib is reached whole, as `@/libs/api`, while a feature is reached by layer and carries no barrel of its own. */
  barrelledContainers: ['libs'],
  /* What sits at the root of the sources and answers to no module: the router, the assets, the shared layers. */
  rootContexts: [
    'app',
    'assets',
    'components',
    'constants',
    'hooks',
    'providers',
    STORYBOOK_FOLDER,
    'styles',
    'theme',
    'types',
    'utils',
  ],
  /*
   * Each of these mirrors the layers it holds, the way `types` does, and its barrel is what keeps the sides apart.
   * `server` holds what only the server may run; `private` and `public` split a library by the credential its
   * callers carry, which is what decides who may import which half.
   */
  mirrorFolders: [SUFFIX_TO_FOLDER.type, SUFFIX_TO_FOLDER.spec, 'private', 'public', 'server'],
  /* The router names its own files, Storybook names its own, and a component is named after the function in it. */
  suffixFreeFolders: ['app', 'components', STORYBOOK_FOLDER],
  /*
   * Playwright names the files that set a run up, the kind closes the name of a spec it runs, and a story sits
   * beside the component it shows rather than in a folder of its own.
   */
  folderlessSuffixes: [...DEFAULT_ARCHITECTURE.folderlessSuffixes, 'e2e', STORY_SUFFIX],
  /* What a component or a hook takes is read beside it. */
  coLocatedTypeSuffixes: ['component', 'hook', 'provider', 'screen', 'store'],
}

/**
 * How a React project writes a documentation comment.
 *
 * The App Router calls these names instead of importing them, so what they are is the framework's documentation
 * rather than this project's, and the same sentence on every page says nothing.
 */
export const NEXTJS_TSDOC: TsdocOptions = {
  ...DEFAULT_TSDOC,
  frameworkSymbols: [
    'default',
    'dynamic',
    'generateMetadata',
    'generateStaticParams',
    'generateViewport',
    'metadata',
    'middleware',
    'proxy',
    'register',
    'revalidate',
    'viewport',
    'DELETE',
    'GET',
    'HEAD',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
  ],
}

/**
 * How a React project writes a spec.
 *
 * An end-to-end run of a browser goes through the browser, so the client a spec of that kind imports is the runner
 * that drives one rather than a client of HTTP.
 */
export const NEXTJS_TESTING: TestingOptions = {
  ...DEFAULT_TESTING,
  suffixToFolder: NEXTJS_ARCHITECTURE.suffixToFolder,
  httpTest: { kind: 'e2e', client: '@playwright/test' },
}
