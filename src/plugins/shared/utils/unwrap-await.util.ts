import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Unwraps the expression an `await` waits for, so an awaited call is read as the call.
 *
 * @param expression - The expression, awaited or not.
 * @returns The expression without the `await`.
 */
export const unwrapAwait = (expression: TSESTree.Expression): TSESTree.Expression => {
  if (expression.type === AST_NODE_TYPES.AwaitExpression) return expression.argument

  return expression
}
