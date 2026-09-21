import type { PluginRule } from '../../shared/types/index.js'

/** What the `tsdoc` rules judge against. The comments of a file: their form, their presence and their tags. */
export interface TsdocOptions {
  /** The column a comment is wrapped at, which is the one the formatter wraps code at. */
  commentWidth: number
  /** The folder tests live in, which documents nothing for a caller. */
  testFolder: string
  /** The names a framework calls rather than a caller imports, which document nothing to anybody. */
  frameworkSymbols: string[]
}

/** A rule of this plugin: one options object, the vocabulary above. */
export type TsdocRule<TMessageId extends string> = PluginRule<TMessageId, TsdocOptions>
