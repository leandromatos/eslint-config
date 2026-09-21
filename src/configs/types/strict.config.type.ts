import type { ArchitectureOptions } from '../../plugins/architecture/types/index.js'
import type { NamingOptions } from '../../plugins/naming/types/index.js'
import type { TestingOptions } from '../../plugins/testing/types/index.js'
import type { TextOptions } from '../../plugins/text/types/index.js'
import type { TsdocOptions } from '../../plugins/tsdoc/types/index.js'
import type { TypescriptOptions } from '../../plugins/typescript/types/index.js'

/**
 * What a project says to the strict preset on top of the defaults.
 *
 * Every field is partial: the preset carries a convention for each plugin, and a project states only where it
 * differs. `text` has no default, because what a product's strings look like is the product's to decide.
 */
export interface StrictOptions {
  /**
   * What a value, a method and a spec fixture are called: the generic types that contribute a word, the verbs whose
   * result opens with a participle, the layers whose methods carry their resource. Defaults to the default words.
   */
  naming?: Partial<NamingOptions>
  /** The comments of a file: the column they are wrapped at, and the folder whose comments document nobody. */
  tsdoc?: Partial<TsdocOptions>
  /**
   * The shape of the project: which suffix lives in which folder, which folders mirror the tree, which directories
   * under the source root are contexts of their own. Read by the boundaries too, so both cannot disagree.
   */
  architecture?: Partial<ArchitectureOptions>
  /** How a spec is written and where it sits: the test folder, its kinds, and which of them mirror a source. */
  testing?: Partial<TestingOptions>
  /** The strings the product ships, and the pattern each one matches. No default: this is the product's to decide. */
  text?: Partial<TextOptions>
  /** How the language's own constructs are written: the suffix of the files a declared vocabulary lives in. */
  typescript?: Partial<TypescriptOptions>
  /** Files the linter never reads, beyond the ones every project ignores. */
  ignores?: string[]
  /** The files the rules judge, which defaults to the sources of a project. */
  files?: string[]
}
