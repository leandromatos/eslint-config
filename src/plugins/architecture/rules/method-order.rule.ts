import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, MethodOrderMessageId } from '../types/index.js'

/**
 * The methods of a class in an ordered layer come in two blocks, public then private, each in
 * alphabetical order. What the class does for others reads first; what it does for itself reads
 * after; and within a block a method is found by its name, in the same place in every layer.
 */
export const methodOrder: ArchitectureRule<MethodOrderMessageId> = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'A class in an ordered layer lists its public methods alphabetically, then its private ones.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/method-order.md',
      dialects: ['TypeScript'],
    },
    messages: {
      outOfOrder:
        '"{{method}}" comes after "{{previous}}". Methods of one visibility are listed alphabetically; move it up.',
      privateBeforePublic:
        '"{{method}}" is public and comes after "{{previous}}", which is not. Public methods come first.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ orderedSuffixes }] = context.options
    if (!where?.suffix || !orderedSuffixes.includes(where.suffix)) return {}
    const listener: TSESLint.RuleListener = {
      ClassBody: classBody => {
        let previous: TSESTree.MethodDefinition | null = null
        for (const member of classBody.body) {
          /* A method under a computed key has no name to sort by, so it is read past rather than placed. */
          if (!isMethod(member) || member.computed) continue
          const before = previous
          previous = member
          if (!before) continue
          const messageId = judge(before, member)
          if (!messageId) continue
          context.report({
            node: member,
            messageId,
            data: { method: nameOf(member), previous: nameOf(before) },
            fix: ruleFixer => swap(ruleFixer, context.sourceCode, before, member),
          })
        }
      },
    }

    return listener
  },
}

const judge = (before: TSESTree.MethodDefinition, after: TSESTree.MethodDefinition): MethodOrderMessageId | null => {
  const wasPublic = isPublic(before)
  const isNowPublic = isPublic(after)
  if (!wasPublic && isNowPublic) return 'privateBeforePublic'
  if (wasPublic === isNowPublic && nameOf(before).localeCompare(nameOf(after)) > 0) return 'outOfOrder'

  return null
}

const isPublic = (member: TSESTree.MethodDefinition): boolean =>
  member.accessibility !== 'private' && member.accessibility !== 'protected'

const nameOf = (member: TSESTree.MethodDefinition): string => {
  /* v8 ignore next -- a method under a computed key is read past before the name is asked for */
  if (member.key.type === AST_NODE_TYPES.Identifier) return member.key.name

  /* v8 ignore next -- a method under a computed key is read past before the name is asked for */
  return ''
}

const isMethod = (member: TSESTree.ClassElement): member is TSESTree.MethodDefinition =>
  member.type === AST_NODE_TYPES.MethodDefinition && member.kind === 'method'

/**
 * Exchanges two adjacent members, each with its comments, and keeps whatever sits between them.
 *
 * @param ruleFixer - What writes the fix.
 * @param sourceCode - The source the members are written in.
 * @param before - The member declared first.
 * @param after - The member declared second.
 * @returns The fix that swaps them.
 */
const swap = (
  ruleFixer: TSESLint.RuleFixer,
  sourceCode: TSESLint.SourceCode,
  before: TSESTree.MethodDefinition,
  after: TSESTree.MethodDefinition,
): TSESLint.RuleFix => {
  const beforeStart = startOf(sourceCode, before)
  const afterStart = startOf(sourceCode, after)
  const beforeText = sourceCode.text.slice(beforeStart, before.range[1])
  const between = sourceCode.text.slice(before.range[1], afterStart)
  const afterText = sourceCode.text.slice(afterStart, after.range[1])

  return ruleFixer.replaceTextRange([beforeStart, after.range[1]], `${afterText}${between}${beforeText}`)
}

/**
 * Where a member starts, its leading comments included, so a doc block travels with its method.
 *
 * @param sourceCode - The source the member is written in.
 * @param member - The member the class declares.
 * @returns The offset the member opens at.
 */
const startOf = (sourceCode: TSESLint.SourceCode, member: TSESTree.MethodDefinition): number => {
  const first = sourceCode.getCommentsBefore(member)[0]
  if (!first) return member.range[0]

  return first.range[0]
}
