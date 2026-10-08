import type { TSESTree } from '@typescript-eslint/utils'

/** A function whose comment reads as a sentence and whose tags carry text. */
export type DescribedFunction =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.TSDeclareFunction
