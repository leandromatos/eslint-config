import type { TSESTree } from '@typescript-eslint/utils'

/** The messages `comment-form` reports. */
export type CommentFormMessageId = 'lineRun' | 'oneLineBlock' | 'pastWidth' | 'tagAgainstSummary'

/** One paragraph of a block comment, as the rewrap reads it. */
export interface CommentParagraph {
  /** The text, joined into one line, and empty for a fenced block. */
  text: string
  /** The lines of a fenced block, kept as written, and none for a paragraph of text. */
  verbatim: string[]
  /** Whether a blank line separates it from the paragraph above it in the comment as written. */
  isAfterBlank: boolean
}

/** A run of line comments on consecutive lines, which holds one comment at least. */
export type CommentRun = [TSESTree.Comment, ...TSESTree.Comment[]]
