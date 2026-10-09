import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Whether a member of a class body is a method, constructor and accessors left out.
 *
 * @param member - The member the class declares.
 * @returns Whether it is a method.
 */
export const isMethod = (member: TSESTree.ClassElement): member is TSESTree.MethodDefinition =>
  member.type === AST_NODE_TYPES.MethodDefinition && member.kind === 'method'

/**
 * Whether the member is part of what the class offers: TypeScript's default visibility is public, and a member
 * named with `#` is private to the class whatever it declares.
 *
 * @param member - The member the class declares.
 * @returns Whether a caller outside the class reads it.
 */
export const isPublic = (member: TSESTree.MethodDefinition | TSESTree.PropertyDefinition): boolean =>
  member.accessibility !== 'private' &&
  member.accessibility !== 'protected' &&
  member.key.type !== AST_NODE_TYPES.PrivateIdentifier

/**
 * Reads the name a member is declared with, `#name` for one private to the class, the text of a key written as a
 * literal, and null for a computed one.
 *
 * A computed key is a name the source does not spell: `[key]()` is whatever `key` held when the class was built, so
 * reading the identifier would report a variable as if it were the member.
 *
 * @param member - The member the class declares.
 * @returns The name.
 */
export const readMemberName = (
  member: TSESTree.MethodDefinition | TSESTree.PropertyDefinition | TSESTree.TSAbstractMethodDefinition,
): string | null => {
  if (member.computed) return null
  if (member.key.type === AST_NODE_TYPES.Identifier) return member.key.name
  if (member.key.type === AST_NODE_TYPES.PrivateIdentifier) return `#${member.key.name}`

  return String(member.key.value)
}
