import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { NamingOptions } from '../../plugins/naming/types/index.js'
import type { TestingOptions } from '../../plugins/testing/types/index.js'
import type { TextOptions } from '../../plugins/text/types/index.js'
import type { TsdocOptions } from '../../plugins/tsdoc/types/index.js'
import type { TypescriptOptions } from '../../plugins/typescript/types/index.js'
import type { DefaultLayerSuffix } from '../types/constants/index.js'
import { readFolders } from './suffix-dictionary.constant.js'

/**
 * Every folder of a module, by the suffix the files inside it carry.
 *
 * The suffixes a project on no framework writes, cut from the dictionary, which is where a folder is spelled. Every
 * default below that names a folder reads it from here, so no two rules can end up judging different trees. A project
 * that writes other layers passes a map of its own, which is what `architecture.suffixToFolder` is for, and the
 * dictionary is what checks it.
 */
export const SUFFIX_TO_FOLDER = readFolders([
  'adapter',
  'cache',
  'client',
  'config',
  'constant',
  'controller',
  'decorator',
  'doc',
  'dto',
  'entity',
  'error',
  'example',
  'factory',
  'fixture',
  'guard',
  'key',
  'locale',
  'mock',
  'notification',
  'parser',
  'query',
  'repository',
  'rule',
  'schema',
  'script',
  'service',
  'spec',
  'specification',
  'store',
  'template',
  'transformer',
  'type',
  'util',
])

/** The column the formatter wraps code at, and so the column a comment is wrapped at. */
const COMMENT_WIDTH = 120

/**
 * How a name is read.
 *
 * The participles are English and the generics are TypeScript's own, plus what the mocking library of this package
 * returns; a project adds its own by passing them. The layers and the hooks are the stack these conventions assume, the
 * one the architecture defaults map to folders: a project on another stack passes its own, and one with no layer
 * classes passes an empty list, which turns the rule off.
 */
export const DEFAULT_NAMING: NamingOptions = {
  roleNames: ['result', 'expected'],
  /* A name that says what the value is made of rather than what it is: the container, never the content. */
  forbiddenNames: ['data'],
  verbParticiples: {
    build: 'built',
    create: 'created',
    createMock: 'mocked',
    createOrUpdate: 'createdOrUpdated',
    hash: 'hashed',
    process: 'processed',
    to: 'transformed',
    update: 'updated',
  },
  valueCases: [],
  assertionMatchers: ['toEqual', 'toStrictEqual', 'toBe', 'toMatchObject'],
  resourceSuffixes: [],
  resourceFreeStems: [],
  resourceFreeMethods: ['onApplicationBootstrap', 'onApplicationShutdown', 'onModuleDestroy', 'onModuleInit'],
  testFolder: SUFFIX_TO_FOLDER.spec,
}

/** How a comment is written, which depends on the formatter and on nothing else. */
export const DEFAULT_TSDOC: TsdocOptions = {
  commentWidth: COMMENT_WIDTH,
  testFolder: SUFFIX_TO_FOLDER.spec,
  /* A project on no framework has none: every exported name is one a caller imports. */
  frameworkSymbols: [],
}

/**
 * The shape of a NestJS project here.
 *
 * Every entry is a convention rather than a law: a project that names a folder differently passes its own map, and a
 * project of another framework passes one of its own entirely.
 */
export const DEFAULT_ARCHITECTURE: ArchitectureOptions = {
  alias: '@',
  /* A tree of modules names every file by its suffix, and declares a type in the folder that mirrors the source. */
  suffixFreeFolders: [],
  coLocatedTypeSuffixes: [],
  suffixToFolder: SUFFIX_TO_FOLDER,
  folderlessSuffixes: ['module', 'setup'],
  /*
   * The directories that hold modules rather than layers. A NestJS tree puts its modules at the root of the sources
   * and names none of these; a Bulletproof tree groups them, and the layer starts one segment later.
   */
  effectHooks: [],
  moduleContainers: [],
  barrelledContainers: [],
  mirrorFolders: [SUFFIX_TO_FOLDER.type, SUFFIX_TO_FOLDER.spec],
  /* What sits at the root of the sources and is a context of its own rather than a module. A project names its own. */
  rootContexts: [],
  /* A folder a runtime executes rather than a caller imports, so nothing in it is reached through a barrel. */
  executedFolders: [SUFFIX_TO_FOLDER.script],
  typeSuffixes: {},
  orderedSuffixes: [],
  wholeArguments: [],
  testFolder: SUFFIX_TO_FOLDER.spec,
  testKinds: ['unit', 'e2e', 'conformance'],
  mirroringTestKinds: ['unit'],
}

/** How a spec is written: the kinds, and the client an end-to-end spec sends requests with. */
export const DEFAULT_TESTING: TestingOptions = {
  testFolder: SUFFIX_TO_FOLDER.spec,
  testKinds: DEFAULT_ARCHITECTURE.testKinds,
  mirroringTestKinds: DEFAULT_ARCHITECTURE.mirroringTestKinds,
  suffixToFolder: DEFAULT_ARCHITECTURE.suffixToFolder,
  httpTest: { kind: 'e2e', client: 'supertest' },
}

/** How the language's own constructs are written: a vocabulary is a pair, and it lives where the types live. */
export const DEFAULT_TYPESCRIPT: TypescriptOptions = {
  typeSuffix: 'type' satisfies DefaultLayerSuffix,
}

/** Nothing: what a product's strings look like is the product's to decide, and a stack says how they are written. */
export const DEFAULT_TEXT: TextOptions = {
  stringPatterns: [],
}
