import type { PluginRule } from '../../shared/types/shared.type.js'
import type { StringPattern } from './rules/string-pattern.rule.type.js'

/** What the `text` rules judge against. The strings the product ships. */
export interface TextOptions {
  /** Strings handed to known calls, and the shape each keeps. */
  stringPatterns: StringPattern[]
}

/** A rule of this plugin: one options object, the vocabulary above. */
export type TextRule<TMessageId extends string> = PluginRule<TMessageId, TextOptions>
