import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * The methods of a class body, constructor left out.
 *
 * @param member - The member the class declares.
 * @returns Whether it is a method.
 */
export const isMethod = (member: TSESTree.ClassElement): member is TSESTree.MethodDefinition =>
  member.type === AST_NODE_TYPES.MethodDefinition && member.kind === 'method'

/**
 * Whether the member is part of what the class offers: TypeScript's default visibility is public.
 *
 * @param member - The member the class declares.
 * @returns Whether a caller outside the class reads it.
 */
export const isPublic = (member: TSESTree.MethodDefinition | TSESTree.PropertyDefinition): boolean =>
  member.accessibility !== 'private' && member.accessibility !== 'protected'

/**
 * The name a member is declared with, or an empty string for a computed one.
 *
 * A computed key is a name the source does not spell: `[key]()` is whatever `key` held when the class was built, so
 * reading the identifier would report a variable as if it were the member.
 *
 * @param member - The member the class declares.
 * @returns The name.
 */
export const memberNameOf = (member: TSESTree.MethodDefinition | TSESTree.PropertyDefinition): string => {
  if (!member.computed && member.key.type === AST_NODE_TYPES.Identifier) return member.key.name

  return ''
}
