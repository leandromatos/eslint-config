import type { TSESLint } from '@typescript-eslint/utils'

/** Where a file sits relative to `src/`, split into what the rules look at. */
export interface Location {
  /** The file name, suffix included. */
  file: string
  /** The directories between `src/` and the file. */
  segments: string[]
  /** The first segment, or an empty string for a file at the root of `src/`. */
  module: string
  /** The suffix the file name carries, and null for a file named without one. */
  suffix: string | null
  /** The file name before its suffix. */
  stem: string
}

/** A rule of any of these plugins: one options object, the vocabulary its plugin declares. */
export type PluginRule<TMessageId extends string, TOptions> = TSESLint.RuleModule<TMessageId, [TOptions]>

/** A problem a file-level judge found: which message, with which data. */
interface Finding<TMessageId extends string> {
  /** Which message the rule reports. */
  messageId: TMessageId
  /** What the message is filled with. */
  data: Record<string, string>
}

/** Judges one file against the options and returns one finding per problem. */
export type Judge<TMessageId extends string, TOptions> = (
  where: Location,
  options: TOptions,
  context: TSESLint.RuleContext<TMessageId, [TOptions]>,
) => Finding<TMessageId>[]
