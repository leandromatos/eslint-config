import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { NamingOptions } from '../../plugins/naming/types/index.js'
import type { HttpTest } from '../../plugins/testing/types/index.js'
import type { TextOptions } from '../../plugins/text/types/index.js'
import type { TsdocOptions } from '../../plugins/tsdoc/types/index.js'
import type { TypescriptOptions } from '../../plugins/typescript/types/index.js'
import type { GroupExtension, ListExtension } from './utils/index.js'

/**
 * The shape of a project as `architecture` takes it, plus the suffixes the project writes that no dictionary carries.
 *
 * `suffixDictionary` is read where the configuration is written, to check the folder of every suffix, and never
 * reaches a rule.
 */
export type ArchitectureExtension = GroupExtension<ArchitectureOptions> & {
  /**
   * The suffixes this project writes beyond the dictionary of the package, each paired with the folder that holds it.
   */
  suffixDictionary?: Readonly<Record<string, string>>
}

/** What a project says about its specs. The test folder and the kinds are said once, in `architecture`. */
export interface TestingExtension {
  /** The test kind that goes through HTTP, and the module a spec of that kind imports to send a request. */
  httpTest?: HttpTest
}

/**
 * A vocabulary a project takes on purpose, such as the voice of a house, applied over the tier before the project's
 * own options. A group it names extends the group of the tier the way the options of a project do.
 */
export interface Preset {
  /** The shape of the project. */
  architecture?: GroupExtension<ArchitectureOptions>
  /** What a value, a method and a spec fixture are called. */
  naming?: GroupExtension<Omit<NamingOptions, 'testFolder'>>
  /** How a spec of the end-to-end kind reaches the application. */
  testing?: TestingExtension
  /** The strings the product ships. */
  text?: GroupExtension<TextOptions>
  /** The comments of a file. */
  tsdoc?: GroupExtension<TsdocOptions>
  /** The constructs of the language. */
  typescript?: GroupExtension<TypescriptOptions>
}

/**
 * What a project says to the strict tier on top of its defaults.
 *
 * Every field is optional. A list or a map joins the default of the tier, and a function in its place receives the
 * default and answers the whole value, which is how an entry is removed. Anything else replaces the default. The test
 * folder and the test kinds are said once, in `architecture`, and every plugin that reads them is handed the same
 * value.
 */
export interface StrictOptions {
  /** What a value, a method and a spec fixture are called. */
  naming?: GroupExtension<Omit<NamingOptions, 'testFolder'>>
  /**
   * The comments of a file: the column they are wrapped at, the release tags a tool reads, the conditions a throw
   * names.
   */
  tsdoc?: GroupExtension<TsdocOptions>
  /**
   * The shape of the project: which suffix lives in which folder, which folders mirror the tree, which directories
   * under the source root are contexts of their own. The import boundaries read the same map.
   */
  architecture?: ArchitectureExtension
  /** How a spec of the end-to-end kind reaches the application. */
  testing?: TestingExtension
  /** The strings the product ships, and the pattern each one matches. */
  text?: GroupExtension<TextOptions>
  /** How the language's own constructs are written: the suffix of the files a declared vocabulary lives in. */
  typescript?: GroupExtension<TypescriptOptions>
  /** The presets the project takes, applied over the tier in order, before every other option. */
  presets?: Preset[]
  /** Files the linter never reads, beyond the ones the tier ignores. */
  ignores?: ListExtension<string>
  /** The files the rules judge, beyond the sources the tier reads. */
  files?: ListExtension<string>
  /**
   * The directory of one package of a monorepo, from the root of the repository, such as `packages/web`. The tier then
   * reads its globs under that package and leaves out the layers of `recommended`, which the root configuration
   * carries once for the whole repository; only what ignores a file comes along. Defaults to the repository itself.
   */
  basePath?: string
}

/**
 * Everything a tier judges with when a project says nothing: the vocabulary of every plugin, the files, and what the
 * linter never reads.
 *
 * `strict` and each framework tier carry one, and the project's options extend it. The test folder and the test kinds
 * are read from `architecture` by every plugin that needs them, so the vocabulary holds them once.
 */
export interface TierVocabulary {
  /** The files the rules judge. */
  files: string[]
  /** What the linter never reads, on top of what `recommended` ignores. */
  ignores: string[]
  /** The shape of the project. */
  architecture: ArchitectureOptions
  /** What a value, a method and a spec fixture are called. */
  naming: Omit<NamingOptions, 'testFolder'>
  /** How a spec of the end-to-end kind reaches the application, when the tier has one. */
  testing: TestingExtension
  /** The strings the product ships. */
  text: TextOptions
  /** The comments of a file. */
  tsdoc: TsdocOptions
  /** The constructs of the language. */
  typescript: TypescriptOptions
  /** The files of constants, which the rules that read a file of constants judge. */
  constantFiles: string[]
  /**
   * The kinds of file whose exported values end in the kind's word, such as `example`: every value a `.example.ts` file
   * exports ends in `Example`, and no value outside one carries the word.
   */
  valueSuffixes: string[]
}
