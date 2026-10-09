import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Looks past `as` and `satisfies`, which check a value and leave it the value it is.
 *
 * @param node - The value as written.
 * @returns The value under the assertion.
 */
export const unwrapAssertion = (node: TSESTree.Node): TSESTree.Node => {
  if (node.type === AST_NODE_TYPES.TSAsExpression || node.type === AST_NODE_TYPES.TSSatisfiesExpression)
    return unwrapAssertion(node.expression)

  return node
}
