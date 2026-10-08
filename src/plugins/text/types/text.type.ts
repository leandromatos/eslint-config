import type { PluginRule } from '../../shared/types/index.js'
import type { StringPattern } from './rules/index.js'

/**
 * What the `text` rules judge against. The strings the product ships, and how every word the code carries is spelled.
 */
export interface TextOptions {
  /** Strings handed to known calls, and the shape each keeps. */
  stringPatterns: StringPattern[]
  /**
   * The words another system defines in British spelling, which the code compares and so keeps as written: a field
   * of a third-party payload, a CSS keyword, a value of an external API. Read in any case.
   */
  spellingExceptions: string[]
}

/** A rule of this plugin: one options object, the vocabulary above. */
export type TextRule<TMessageId extends string> = PluginRule<TMessageId, TextOptions>
