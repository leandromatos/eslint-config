import type { TSESTree } from '@typescript-eslint/utils'
import { AST_TOKEN_TYPES } from '@typescript-eslint/utils'

/**
 * Whether a comment is a documentation comment: a block that opens with two asterisks and not a third.
 *
 * @param comment - The comment.
 * @returns Whether it documents what follows it.
 */
export const isDocComment = (comment: TSESTree.Comment): boolean =>
  comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith('*') && !comment.value.startsWith('**')
