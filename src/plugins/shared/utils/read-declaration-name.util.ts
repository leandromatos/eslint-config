import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { readMemberName } from './class-members.util.js'

/**
 * Reads the name a class or a method is declared with, for a message.
 *
 * @param node - The declaration.
 * @returns The name, or what stands for one the source does not spell.
 */
export const readDeclarationName = (node: TSESTree.ClassDeclaration | TSESTree.MethodDefinition): string => {
  if (node.type === AST_NODE_TYPES.ClassDeclaration) return node.id?.name ?? '(anonymous)'

  return readMemberName(node) ?? '(computed)'
}
