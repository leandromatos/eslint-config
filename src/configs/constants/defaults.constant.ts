import { TYPE_SUFFIX } from '../../plugins/architecture/constants/index.js'
import type { ArchitectureOptions, WholeArgument } from '../../plugins/architecture/types/index.js'
import type { ForbiddenName, ForbiddenWord, NamingOptions, ValueCase } from '../../plugins/naming/types/index.js'
import { DEFAULT_IMPORT_ALIAS } from '../../plugins/shared/constants/index.js'
import type { StringPattern, TextOptions } from '../../plugins/text/types/index.js'
import type { ThrowsCondition, TsdocOptions } from '../../plugins/tsdoc/types/index.js'
import type { TypescriptOptions } from '../../plugins/typescript/types/index.js'
import type { DictionarySuffix, TestingExtension, TierVocabulary } from '../types/index.js'
import { TS_SOURCES } from './sources.constant.js'
import { AGNOSTIC_SUFFIX_DICTIONARY } from './suffix-dictionary.constant.js'

/** The files `strict` judges when a project names none: the TypeScript of every source root, and the root scripts. */
export const DEFAULT_FILES = TS_SOURCES

/** What `strict` ignores on top of `recommended`: nothing, until a tier names what its tools write. */
export const DEFAULT_IGNORES: string[] = []

/** The prefix an import names the source root with. */
export const DEFAULT_ALIAS = DEFAULT_IMPORT_ALIAS

/** The folders whose files are named by what they hold rather than by a suffix: none, in a tree of modules. */
export const DEFAULT_SUFFIX_FREE_FOLDERS: string[] = []

/** The suffixes whose types are declared beside the file rather than in its mirror: none, in a tree of modules. */
export const DEFAULT_CO_LOCATED_TYPE_SUFFIXES: string[] = []

/** Every file named by the agnostic layer it belongs to, and the folder that holds it. */
export const DEFAULT_SUFFIX_TO_FOLDER: Record<string, string> = AGNOSTIC_SUFFIX_DICTIONARY

/** The suffixes a file carries without a folder of its own: the files a test runner names to set a run up and down. */
export const DEFAULT_FOLDERLESS_SUFFIXES = ['setup', 'teardown']

/**
 * The suffix of the file named after its directory that a framework reads as a module: a Nest one, a local Expo one.
 */
export const MODULE_SUFFIX = 'module'

/** The hooks an effect is written with, which only a hook of the project may call: none, outside React. */
export const DEFAULT_EFFECT_HOOKS: string[] = []

/** The directives that make a function read what it calls where it is declared: none, unless a runtime says so. */
export const DEFAULT_DEFINITION_TIME_DIRECTIVES: string[] = []

/** The folders that hold the base classes of a capability: none, in a project, since those are a package's. */
export const DEFAULT_BASE_FOLDERS: string[] = []

/** The directories that hold modules rather than layers: none, in a tree that puts its modules at the root. */
export const DEFAULT_MODULE_CONTAINERS: string[] = []

/** The containers whose modules are imported whole, through the barrel at their root: none. */
export const DEFAULT_BARRELLED_CONTAINERS: string[] = []

/** The folders that mirror the sources: the types beside the files they describe, and the specs. */
export const DEFAULT_MIRROR_FOLDERS = [AGNOSTIC_SUFFIX_DICTIONARY.type, AGNOSTIC_SUFFIX_DICTIONARY.spec]

/** What sits at the root of the sources as a context of its own rather than a module: what a project names. */
export const DEFAULT_ROOT_CONTEXTS: string[] = []

/** The folders a runtime executes rather than a caller imports, so nothing in them is reached through a barrel. */
export const DEFAULT_EXECUTED_FOLDERS = [AGNOSTIC_SUFFIX_DICTIONARY.script]

/** The types a layer declares in its mirror folder, by the suffix their name ends in: none, outside a framework. */
export const DEFAULT_TYPE_SUFFIXES: Record<string, string[]> = {}

/** The layers a class walks down, outermost first: none, outside a framework. */
export const DEFAULT_ORDERED_SUFFIXES: string[] = []

/** The objects a layer passes on whole: none, outside a framework. */
export const DEFAULT_WHOLE_ARGUMENTS: WholeArgument[] = []

/** The folder the specs live in, which is the name the ecosystem uses. */
export const DEFAULT_TEST_FOLDER = AGNOSTIC_SUFFIX_DICTIONARY.spec

/** What a package ships for its consumers' tests, and what a project keeps for its own: never production code. */
export const DEFAULT_TESTING_FOLDER = 'testing'

/**
 * Where Vitest, Jest and Storybook read the stand-in of a module, beside it and under the same file name. A test
 * loads it and the application never does, so it answers to the rules as the test tree does.
 */
export const DEFAULT_MOCK_FOLDER = '__mocks__'

/** The suffixes of files only a development tool loads: none, in a project that runs no catalog. */
export const DEFAULT_DEVELOPMENT_SUFFIXES: string[] = []

/**
 * The kinds of test a project may write, by name, each a folder under the test folder.
 *
 * - `unit`: one source file, with what it calls replaced.
 * - `integration`: one source file, with what it calls running for real.
 * - `contract`: the shape of an interface another party relies on.
 * - `e2e`: the application booted and driven from outside.
 * - `conformance`: a property of the whole codebase.
 * - `smoke`: a deployed application that answers at all.
 * - `performance`: how fast, or how much, under a load.
 */
export const DEFAULT_TEST_KIND = {
  unit: 'unit',
  integration: 'integration',
  contract: 'contract',
  e2e: 'e2e',
  conformance: 'conformance',
  smoke: 'smoke',
  performance: 'performance',
}

/** Every kind a project may write. A project writes the ones it needs, and a kind never written costs nothing. */
export const DEFAULT_TEST_KINDS = Object.values(DEFAULT_TEST_KIND)

/** The two kinds that exercise one source file, so each spec mirrors the file it covers. */
export const DEFAULT_MIRRORING_TEST_KINDS = [DEFAULT_TEST_KIND.unit, DEFAULT_TEST_KIND.integration]

/**
 * The shape of a project on no framework: every file named by the agnostic layer it belongs to, types and tests in
 * the folders that mirror the sources.
 *
 * Every field is one of the constants above, so a project extends a field by reading the constant of that name.
 */
export const DEFAULT_ARCHITECTURE: ArchitectureOptions = {
  alias: DEFAULT_ALIAS,
  suffixFreeFolders: DEFAULT_SUFFIX_FREE_FOLDERS,
  coLocatedTypeSuffixes: DEFAULT_CO_LOCATED_TYPE_SUFFIXES,
  suffixToFolder: DEFAULT_SUFFIX_TO_FOLDER,
  folderlessSuffixes: DEFAULT_FOLDERLESS_SUFFIXES,
  effectHooks: DEFAULT_EFFECT_HOOKS,
  definitionTimeDirectives: DEFAULT_DEFINITION_TIME_DIRECTIVES,
  baseFolders: DEFAULT_BASE_FOLDERS,
  moduleContainers: DEFAULT_MODULE_CONTAINERS,
  barrelledContainers: DEFAULT_BARRELLED_CONTAINERS,
  mirrorFolders: DEFAULT_MIRROR_FOLDERS,
  rootContexts: DEFAULT_ROOT_CONTEXTS,
  executedFolders: DEFAULT_EXECUTED_FOLDERS,
  typeSuffixes: DEFAULT_TYPE_SUFFIXES,
  orderedSuffixes: DEFAULT_ORDERED_SUFFIXES,
  wholeArguments: DEFAULT_WHOLE_ARGUMENTS,
  testFolder: DEFAULT_TEST_FOLDER,
  testingFolder: DEFAULT_TESTING_FOLDER,
  mockFolder: DEFAULT_MOCK_FOLDER,
  developmentSuffixes: DEFAULT_DEVELOPMENT_SUFFIXES,
  testKinds: DEFAULT_TEST_KINDS,
  mirroringTestKinds: DEFAULT_MIRRORING_TEST_KINDS,
}

/** The names a spec gives the value under test and the value it is compared against. */
export const DEFAULT_ROLE_NAMES = ['result', 'expected']

/** The names no declaration takes: none, until a project or the `CONTROLLED_LANGUAGE` preset says which. */
export const DEFAULT_FORBIDDEN_NAMES: ForbiddenName[] = []

/** The words no name carries: none, until a project or the `CONTROLLED_LANGUAGE` preset says which. */
export const DEFAULT_FORBIDDEN_WORDS: ForbiddenWord[] = []

/** What the result of a verb is named after: the participle of the verb, in English. */
export const DEFAULT_VERB_PARTICIPLES: Record<string, string> = {
  build: 'built',
  create: 'created',
  createOrUpdate: 'createdOrUpdated',
  hash: 'hashed',
  process: 'processed',
  update: 'updated',
}

/** The casing a value takes by the name of what holds it: none, outside a framework. */
export const DEFAULT_VALUE_CASES: ValueCase[] = []

/** The matchers that compare a result against what a spec expects. */
export const DEFAULT_ASSERTION_MATCHERS = ['toEqual', 'toStrictEqual', 'toBe', 'toMatchObject']

/** The layers whose methods name the resource they act on: none, outside a framework. */
export const DEFAULT_RESOURCE_SUFFIXES: string[] = []

/** The modules whose resource is the verb's own subject, so a method of theirs names none: what a project names. */
export const DEFAULT_RESOURCE_FREE_STEMS: string[] = []

/** The methods a framework calls by contract, which keep the name it gave them: none, outside a framework. */
export const DEFAULT_RESOURCE_FREE_METHODS: string[] = []

/**
 * How a name is read on any stack: English participles, and nothing forbidden.
 *
 * Every field is one of the constants above, so a project extends a field by reading the constant of that name.
 */
export const DEFAULT_NAMING: Omit<NamingOptions, 'testFolder'> = {
  roleNames: DEFAULT_ROLE_NAMES,
  forbiddenNames: DEFAULT_FORBIDDEN_NAMES,
  forbiddenWords: DEFAULT_FORBIDDEN_WORDS,
  verbParticiples: DEFAULT_VERB_PARTICIPLES,
  valueCases: DEFAULT_VALUE_CASES,
  assertionMatchers: DEFAULT_ASSERTION_MATCHERS,
  resourceSuffixes: DEFAULT_RESOURCE_SUFFIXES,
  resourceFreeStems: DEFAULT_RESOURCE_FREE_STEMS,
  resourceFreeMethods: DEFAULT_RESOURCE_FREE_METHODS,
}

/** The column a comment is wrapped at, which is the one Prettier wraps code at by default. */
export const DEFAULT_COMMENT_WIDTH = 80

/** Whether a tool reads the release tags: no, until a project states it runs TypeDoc or API Extractor. */
export const DEFAULT_READS_RELEASE_TAGS = false

/** The titles the fix of a throw rewords into a condition: none. */
export const DEFAULT_THROWS_CONDITIONS: ThrowsCondition[] = []

/** The properties of an object handed to an exception that carry its title: none. */
export const DEFAULT_THROWS_TITLE_PROPERTIES: string[] = []

/** How a comment is written on any stack. Every field is one of the constants above. */
export const DEFAULT_TSDOC: TsdocOptions = {
  commentWidth: DEFAULT_COMMENT_WIDTH,
  readsReleaseTags: DEFAULT_READS_RELEASE_TAGS,
  throwsConditions: DEFAULT_THROWS_CONDITIONS,
  throwsTitleProperties: DEFAULT_THROWS_TITLE_PROPERTIES,
}

/** How a spec reaches the application on no framework: no kind goes through HTTP until a project names one. */
export const DEFAULT_TESTING: TestingExtension = {}

/** The suffix a file that declares a vocabulary carries, where the types live. */
export const DEFAULT_TYPE_SUFFIX = TYPE_SUFFIX

/** How the language's own constructs are written. Every field is one of the constants above. */
export const DEFAULT_TYPESCRIPT: TypescriptOptions = {
  typeSuffix: DEFAULT_TYPE_SUFFIX,
}

/** The kinds of file whose exported values end in the kind's word: none, outside a framework. */
export const DEFAULT_VALUE_SUFFIXES: string[] = []

/** The suffix a file of constants carries. */
export const DEFAULT_CONSTANT_SUFFIX = 'constant' satisfies DictionarySuffix

/**
 * The files of constants, where every value is written once and an object built from constants writes none in place.
 */
export const DEFAULT_CONSTANT_FILES = [`**/*.${DEFAULT_CONSTANT_SUFFIX}.ts`]

/** The patterns the strings of a product follow: none, since what they look like is the product's to decide. */
export const DEFAULT_STRING_PATTERNS: StringPattern[] = []

/** The strings a product ships. Every field is one of the constants above. */
export const DEFAULT_TEXT: TextOptions = {
  stringPatterns: DEFAULT_STRING_PATTERNS,
}

/** Everything `strict` judges with when a project says nothing. */
export const DEFAULT_VOCABULARY: TierVocabulary = {
  files: DEFAULT_FILES,
  ignores: DEFAULT_IGNORES,
  architecture: DEFAULT_ARCHITECTURE,
  naming: DEFAULT_NAMING,
  testing: DEFAULT_TESTING,
  text: DEFAULT_TEXT,
  tsdoc: DEFAULT_TSDOC,
  typescript: DEFAULT_TYPESCRIPT,
  constantFiles: DEFAULT_CONSTANT_FILES,
  valueSuffixes: DEFAULT_VALUE_SUFFIXES,
}
