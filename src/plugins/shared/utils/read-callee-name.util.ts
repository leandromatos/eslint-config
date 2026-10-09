import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Reads the name a call names: `useEffect` for `useEffect(...)` and for `React.useEffect(...)`, `toEntity` for
 * `this.transformer.toEntity(...)`.
 *
 * @param callExpression - The call.
 * @returns The name, and null for a call of something the source does not name.
 */
export const readCalleeName = (callExpression: TSESTree.CallExpression): string | null => {
  const { callee } = callExpression
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (callee.type === AST_NODE_TYPES.MemberExpression && callee.property.type === AST_NODE_TYPES.Identifier)
    return callee.property.name

  return null
}
