import type { PluginRule } from '../../shared/types/index.js'

/** What the `tsdoc` rules judge against. The comments of a file: their form, their presence and their tags. */
export interface TsdocOptions {
  /** The column a comment is wrapped at, which is the one the formatter wraps code at. */
  commentWidth: number
  /**
   * Whether the project runs a tool that reads the release tags, such as TypeDoc or API Extractor. Without one, a
   * `@public`, `@internal`, `@alpha` or `@beta` claims a pipeline that does not exist.
   */
  readsReleaseTags: boolean
}

/** A rule of this plugin: one options object, the vocabulary above. */
export type TsdocRule<TMessageId extends string> = PluginRule<TMessageId, TsdocOptions>
