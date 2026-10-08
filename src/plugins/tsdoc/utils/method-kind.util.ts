import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Whether a function is the setter of a class or of an object: it takes the value it is assigned, which the accessor
 * name already documents.
 *
 * @param node - The function.
 * @returns Whether it is a setter.
 */
export const isSetter = (node: TSESTree.Node): boolean => kindOf(node) === 'set'

/**
 * Whether a function is the constructor of a class, which builds the instance rather than handing a value back.
 *
 * @param node - The function.
 * @returns Whether it is a constructor.
 */
export const isConstructor = (node: TSESTree.Node): boolean => kindOf(node) === 'constructor'

/**
 * The kind of member a function is the value of.
 *
 * @param node - The function.
 * @returns The kind of the method or the property, and null for a function that is the value of neither.
 */
const kindOf = (node: TSESTree.Node): string | null => {
  const { parent } = node
  if (parent?.type === AST_NODE_TYPES.MethodDefinition && parent.value === node) return parent.kind
  if (parent?.type === AST_NODE_TYPES.Property && parent.value === node) return parent.kind

  return null
}
