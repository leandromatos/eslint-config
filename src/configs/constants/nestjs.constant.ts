import type { ArchitectureOptions, WholeArgument } from '../../plugins/architecture/types/index.js'
import type { NamingOptions, ValueCase, ValueCasing } from '../../plugins/naming/types/index.js'
import type { HttpTest } from '../../plugins/testing/types/index.js'
import type { TestingExtension, TierVocabulary } from '../types/index.js'
import {
  DEFAULT_ARCHITECTURE,
  DEFAULT_EXECUTED_FOLDERS,
  DEFAULT_FOLDERLESS_SUFFIXES,
  DEFAULT_NAMING,
  DEFAULT_SUFFIX_TO_FOLDER,
  DEFAULT_TEST_KIND,
  DEFAULT_VERB_PARTICIPLES,
  DEFAULT_VOCABULARY,
  MODULE_SUFFIX,
} from './defaults.constant.js'
import { TS_SOURCES } from './sources.constant.js'
import type { SUFFIX_DICTIONARY } from './suffix-dictionary.constant.js'
import { AGNOSTIC_SUFFIX_DICTIONARY, NESTJS_SUFFIX_DICTIONARY } from './suffix-dictionary.constant.js'

/** The files a NestJS project's rules judge. */
export const NESTJS_FILES = TS_SOURCES

/** Every file named by the layer it belongs to: the agnostic layers, and the ones NestJS adds. */
export const NESTJS_SUFFIX_TO_FOLDER: Record<string, string> = {
  ...DEFAULT_SUFFIX_TO_FOLDER,
  ...NESTJS_SUFFIX_DICTIONARY,
}

/** The layers of NestJS a list names, by the suffix of their files. */
export const NESTJS_LAYER = {
  cache: 'cache',
  controller: 'controller',
  doc: 'doc',
  example: 'example',
  repository: 'repository',
  schema: 'schema',
  service: 'service',
  specification: 'specification',
  transformer: 'transformer',
} satisfies Record<string, keyof typeof SUFFIX_DICTIONARY>

/**
 * The folders at the root of the sources of a NestJS API that answer to no module and are named by no layer: the
 * configuration, and the capabilities every module reads.
 */
export const NESTJS_FOLDER = {
  config: 'config',
  database: 'database',
  storage: 'storage',
}

/** What sits at the root of the sources and answers to no module: the folders above, the utilities, types and tests. */
export const NESTJS_ROOT_CONTEXTS = [
  // The capability of caching is named after the layer it holds.
  NESTJS_LAYER.cache,
  ...Object.values(NESTJS_FOLDER),
  AGNOSTIC_SUFFIX_DICTIONARY.util,
  AGNOSTIC_SUFFIX_DICTIONARY.type,
  AGNOSTIC_SUFFIX_DICTIONARY.spec,
]

/** A Nest module is the file named after its directory, at the root of the module rather than in a folder. */
export const NESTJS_FOLDERLESS_SUFFIXES = [...DEFAULT_FOLDERLESS_SUFFIXES, MODULE_SUFFIX]

/** A package's capability holds the base classes every driver shares in `core/`, beside the layers. */
export const NESTJS_BASE_FOLDERS = ['core']

/** `migrations` and `seeds` hold no layer: a runtime executes them rather than a caller importing one. */
export const NESTJS_EXECUTED_FOLDERS = [...DEFAULT_EXECUTED_FOLDERS, 'migrations', 'seeds']

/** The layers a class walks down, outermost first: what `method-order` reads. */
export const NESTJS_ORDERED_SUFFIXES = [
  NESTJS_LAYER.controller,
  NESTJS_LAYER.service,
  NESTJS_LAYER.repository,
  NESTJS_LAYER.cache,
  NESTJS_LAYER.transformer,
  NESTJS_LAYER.specification,
]

/** The endings of the type names a layer declares in its mirror folder. */
export const NESTJS_TYPE_NAME_SUFFIX = {
  cacheFallback: 'CacheFallback',
  context: 'Context',
  criteria: 'Criteria',
  includeOption: 'IncludeOption',
  input: 'Input',
  jobContext: 'JobContext',
  jobName: 'JobName',
  meta: 'Meta',
  options: 'Options',
  queryConditions: 'QueryConditions',
  queueName: 'QueueName',
  selectAttributes: 'SelectAttributes',
  templateContext: 'TemplateContext',
}

/**
 * The types a layer declares in its mirror folder, by the suffix their name ends in. Each names something only that
 * layer has: what a queue calls a job, what a repository selects, what a specification narrows by. A type of the
 * domain lives in `types/` like any other.
 */
export const NESTJS_TYPE_SUFFIXES: Record<string, string[]> = {
  [NESTJS_SUFFIX_DICTIONARY.cache]: [NESTJS_TYPE_NAME_SUFFIX.cacheFallback],
  [NESTJS_SUFFIX_DICTIONARY.notification]: [NESTJS_TYPE_NAME_SUFFIX.templateContext],
  [NESTJS_SUFFIX_DICTIONARY.processor]: [
    NESTJS_TYPE_NAME_SUFFIX.jobContext,
    NESTJS_TYPE_NAME_SUFFIX.jobName,
    NESTJS_TYPE_NAME_SUFFIX.queueName,
  ],
  [NESTJS_SUFFIX_DICTIONARY.repository]: [
    NESTJS_TYPE_NAME_SUFFIX.selectAttributes,
    NESTJS_TYPE_NAME_SUFFIX.input,
    NESTJS_TYPE_NAME_SUFFIX.meta,
  ],
  [NESTJS_SUFFIX_DICTIONARY.service]: [
    NESTJS_TYPE_NAME_SUFFIX.input,
    NESTJS_TYPE_NAME_SUFFIX.context,
    NESTJS_TYPE_NAME_SUFFIX.options,
  ],
  [NESTJS_SUFFIX_DICTIONARY.specification]: [
    NESTJS_TYPE_NAME_SUFFIX.criteria,
    NESTJS_TYPE_NAME_SUFFIX.includeOption,
    NESTJS_TYPE_NAME_SUFFIX.queryConditions,
  ],
}

/** The request objects a controller passes on whole, which the service reads the address from. */
export const NESTJS_WHOLE_ARGUMENTS: WholeArgument[] = [
  { suffix: NESTJS_LAYER.controller, objects: ['params', 'query', 'body'] },
]

/** The files that export values named after their kind: an operation's doc, an example, a schema. */
export const NESTJS_VALUE_SUFFIXES = [NESTJS_LAYER.doc, NESTJS_LAYER.example, NESTJS_LAYER.schema]

/**
 * The tree a NestJS project writes.
 *
 * Its modules sit at the root of the sources rather than under a container, and every file is named by the layer it
 * belongs to. Every field the tier changes is one of the constants above; the others are the defaults.
 */
export const NESTJS_ARCHITECTURE: ArchitectureOptions = {
  ...DEFAULT_ARCHITECTURE,
  suffixToFolder: NESTJS_SUFFIX_TO_FOLDER,
  rootContexts: NESTJS_ROOT_CONTEXTS,
  folderlessSuffixes: NESTJS_FOLDERLESS_SUFFIXES,
  baseFolders: NESTJS_BASE_FOLDERS,
  executedFolders: NESTJS_EXECUTED_FOLDERS,
  orderedSuffixes: NESTJS_ORDERED_SUFFIXES,
  typeSuffixes: NESTJS_TYPE_SUFFIXES,
  wholeArguments: NESTJS_WHOLE_ARGUMENTS,
}

/** `createMock` of `@golevelup/ts-vitest` names its result after what it mocks. */
export const NESTJS_VERB_PARTICIPLES: Record<string, string> = { ...DEFAULT_VERB_PARTICIPLES, createMock: 'mocked' }

/**
 * The layers whose methods carry the resource they act on: the ones a module has several of, since two services of
 * one module answer for two resources and the method says which.
 */
export const NESTJS_RESOURCE_SUFFIXES = [
  NESTJS_LAYER.cache,
  NESTJS_LAYER.controller,
  NESTJS_LAYER.repository,
  NESTJS_LAYER.service,
]

/** The hooks Nest calls by contract, which keep the names it gave them. */
export const NESTJS_RESOURCE_FREE_METHODS = [
  'onApplicationBootstrap',
  'onApplicationShutdown',
  'onModuleDestroy',
  'onModuleInit',
]

/** The casing of a segment of a Redis key, which a queue name and a cache namespace are. */
export const NESTJS_KEY_CASING: ValueCasing = 'camelCase'

/** The casing of a job name, which is a field of the hash of its queue rather than a segment of a key. */
export const NESTJS_JOB_CASING: ValueCasing = 'kebab-case'

/** The casing a value keeps by the name of what holds it: a queue name and a namespace as a key, a job name apart. */
export const NESTJS_VALUE_CASES: ValueCase[] = [
  { endsWith: NESTJS_TYPE_NAME_SUFFIX.queueName, casing: NESTJS_KEY_CASING, deep: false },
  { endsWith: NESTJS_TYPE_NAME_SUFFIX.jobName, casing: NESTJS_JOB_CASING, deep: true },
  { endsWith: 'namespace', casing: NESTJS_KEY_CASING, deep: false },
]

/** How a name is read in a NestJS project. Every field the tier changes is one of the constants above. */
export const NESTJS_NAMING: Omit<NamingOptions, 'testFolder'> = {
  ...DEFAULT_NAMING,
  verbParticiples: NESTJS_VERB_PARTICIPLES,
  valueCases: NESTJS_VALUE_CASES,
  resourceSuffixes: NESTJS_RESOURCE_SUFFIXES,
  resourceFreeMethods: NESTJS_RESOURCE_FREE_METHODS,
}

/** The client an end-to-end spec of a NestJS project sends its requests with. */
export const NESTJS_HTTP_CLIENT = 'supertest'

/** An end-to-end spec of a NestJS project sends its requests with supertest. */
export const NESTJS_HTTP_TEST: HttpTest = { kind: DEFAULT_TEST_KIND.e2e, client: NESTJS_HTTP_CLIENT }

/** How a spec of a NestJS project reaches the application. */
export const NESTJS_TESTING: TestingExtension = {
  httpTest: NESTJS_HTTP_TEST,
}

/** Everything `nestjs` judges with when a project says nothing. */
export const NESTJS_VOCABULARY: TierVocabulary = {
  ...DEFAULT_VOCABULARY,
  files: NESTJS_FILES,
  architecture: NESTJS_ARCHITECTURE,
  naming: NESTJS_NAMING,
  testing: NESTJS_TESTING,
  valueSuffixes: NESTJS_VALUE_SUFFIXES,
}
