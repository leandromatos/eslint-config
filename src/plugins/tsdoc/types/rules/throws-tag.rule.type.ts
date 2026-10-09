import type { TSESTree } from '@typescript-eslint/utils'

/** The messages `throws-tag` reports. */
export type ThrowsTagMessageId = 'missingThrows' | 'bracedThrows' | 'untypedThrows' | 'hyphenatedThrows'

/**
 * How the fix of `throws-tag` turns the title an exception carries into the condition its tag states: a title that
 * matches `title` is rewritten into `condition`, where `$1` stands for the first group the pattern captured.
 */
export interface ThrowsCondition {
  /** A regular expression the title has to match, as its source. */
  title: string
  /** The condition the tag states, with `$1` for the first captured group. */
  condition: string
}

/** An exception a function constructs and throws in its own body, with the title it carries when it is a literal. */
export interface ThrownException {
  /** The construction, which is what the report points at. */
  node: TSESTree.NewExpression
  /** The name of the class constructed. */
  type: string
  /** The title, and null where it is not a literal. */
  title: string | null
}
