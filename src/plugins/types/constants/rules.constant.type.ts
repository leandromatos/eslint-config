import type { ArchitectureOptions } from '../../architecture/types/index.js'
import type { NamingOptions } from '../../naming/types/index.js'
import type { TestingOptions } from '../../testing/types/index.js'
import type { TextOptions } from '../../text/types/index.js'
import type { TsdocOptions } from '../../tsdoc/types/index.js'
import type { TypescriptOptions } from '../../typescript/types/index.js'

/** The subject a rule is about, which is the group of the options it reads. */
export type OptionsGroup = 'architecture' | 'naming' | 'testing' | 'text' | 'tsdoc' | 'typescript'

/** What every rule of this plugin judges against, one vocabulary per subject. */
export interface PluginOptions {
  /** Where a file lives, what it is called, and what a layer exposes. */
  architecture: ArchitectureOptions
  /** What a value, a method and a spec fixture are called. */
  naming: NamingOptions
  /** How a spec is written and where it sits. */
  testing: TestingOptions
  /** The strings the product ships. */
  text: TextOptions
  /** The comments of a file: their form, their presence and their tags. */
  tsdoc: TsdocOptions
  /** The constructs of the language itself. */
  typescript: TypescriptOptions
}
