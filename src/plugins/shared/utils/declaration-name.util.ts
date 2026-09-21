import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * The name a class or a method is declared with, for a message.
 *
 * @param node - The declaration.
 * @returns The name, or what stands for one the source does not spell.
 */
export const declarationNameOf = (node: TSESTree.ClassDeclaration | TSESTree.MethodDefinition): string => {
  if (node.type === AST_NODE_TYPES.ClassDeclaration) return node.id?.name ?? '(anonymous)'
  if (!node.computed && node.key.type === AST_NODE_TYPES.Identifier) return node.key.name

  return '(computed)'
}
