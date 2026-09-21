import type { PluginRule } from '../../shared/types/index.js'

/** What the `typescript` rules judge against. How the language's own constructs are written. */
export interface TypescriptOptions {
  /**
   * The suffix a file carrying a declared vocabulary is named by, such as `type`. A pair declared outside a file of
   * that suffix is reported, because the pair is a type and is read where the types are.
   */
  typeSuffix: string
}

/** A rule of this plugin: one options object, the vocabulary above. */
export type TypescriptRule<TMessageId extends string> = PluginRule<TMessageId, TypescriptOptions>
