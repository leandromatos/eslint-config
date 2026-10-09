import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Whether a function is the constructor of a class, which builds the instance rather than handing a value back.
 *
 * @param node - The function.
 * @returns Whether it is a constructor.
 */
export const isConstructor = (node: TSESTree.Node): boolean => readMemberKind(node) === 'constructor'

/**
 * The kind of class member a function is the value of.
 *
 * @param node - The function.
 * @returns The kind of the method, and null for a function that is the value of none.
 */
const readMemberKind = (node: TSESTree.Node): string | null => {
  const { parent } = node
  if (parent?.type === AST_NODE_TYPES.MethodDefinition && parent.value === node) return parent.kind

  return null
}
