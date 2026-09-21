import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { NamingOptions } from '../../plugins/naming/types/index.js'
import { DEFAULT_ARCHITECTURE, DEFAULT_NAMING, SUFFIX_TO_FOLDER } from './defaults.constant.js'
export { NESTJS_TEXT } from './nestjs-text.constant.js'

/** The files a NestJS project's rules judge. */
export const NESTJS_FILES = ['src/**/*.ts']

/**
 * The layers NestJS invents, and the folder each lives in.
 *
 * What the framework names itself, rather than what architecture already had a word for: a repository and an entity
 * live in the base map, and a project on any stack that writes one reads the same folder.
 */
const NESTJS_SUFFIX_TO_FOLDER = {
  ...SUFFIX_TO_FOLDER,
  channel: 'channels',
  interceptor: 'interceptors',
  processor: 'processors',
  strategy: 'strategies',
  transport: 'transports',
} as const

/** The layers a class walks down, outermost first: what `method-order` and the step-down rule read. */
const ORDERED_SUFFIXES = ['controller', 'service', 'repository', 'cache', 'transformer', 'specification']

/**
 * The tree a NestJS project here writes.
 *
 * Its modules sit at the root of the sources rather than under a container, and every file is named by the layer it
 * belongs to. A controller takes the request apart whole, so the objects it destructures are named here.
 */
export const NESTJS_ARCHITECTURE: ArchitectureOptions = {
  ...DEFAULT_ARCHITECTURE,
  suffixToFolder: NESTJS_SUFFIX_TO_FOLDER,
  /* `migrations` and `seeds` hold no layer: a runtime executes them rather than a caller importing one. */
  executedFolders: [SUFFIX_TO_FOLDER.script, 'migrations', 'seeds'],
  orderedSuffixes: ORDERED_SUFFIXES,
  /*
   * The types a layer declares beside itself rather than in the mirror folder.
   *
   * Each names something only that layer has: what a queue calls a job, what a repository selects, what a
   * specification narrows by. A type of the domain lives in `types/` like any other.
   */
  typeSuffixes: {
    [NESTJS_SUFFIX_TO_FOLDER.cache]: ['CacheFallback'],
    [NESTJS_SUFFIX_TO_FOLDER.notification]: ['TemplateContext'],
    [NESTJS_SUFFIX_TO_FOLDER.processor]: ['JobContext', 'JobName', 'QueueName'],
    [NESTJS_SUFFIX_TO_FOLDER.repository]: ['SelectAttributes', 'Input', 'Meta'],
    [NESTJS_SUFFIX_TO_FOLDER.service]: ['Input', 'Context', 'Options'],
    [NESTJS_SUFFIX_TO_FOLDER.specification]: ['Criteria', 'IncludeOption', 'QueryConditions'],
  },
  wholeArguments: [{ suffix: 'controller', objects: ['params', 'query', 'body'] }],
}

/**
 * How a name is read in a NestJS project.
 *
 * The layers whose methods carry the resource they act on are the ones a module has several of: two services of one
 * module answer for two resources, and the method says which.
 */
export const NESTJS_NAMING: NamingOptions = {
  ...DEFAULT_NAMING,
  resourceSuffixes: ['cache', 'controller', 'repository', 'service'],
  /* What the mocking library of this package returns, which names the value after what it mocks. */
  genericNames: { ...DEFAULT_NAMING.genericNames, DeepMocked: '' },
}
