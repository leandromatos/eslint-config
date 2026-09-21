import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * What a call or a member expression is written on: the callee of a call, the object of a member.
 *
 * Walking that one step at a time is what reaches the identifier a chain starts at, `transaction` in
 * `transaction.select().from(table)`.
 *
 * @param node - The call or member expression.
 * @returns What it is written on.
 */
export const receiverOf = (node: TSESTree.CallExpression | TSESTree.MemberExpression): TSESTree.Node => {
  if (node.type === AST_NODE_TYPES.CallExpression) return node.callee

  return node.object
}
