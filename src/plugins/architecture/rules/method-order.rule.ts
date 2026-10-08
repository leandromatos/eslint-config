import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

import { isMethod, isPublic, locate, memberNameOf } from '../../shared/utils/index.js'
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
        /* A method under a computed key has no name to sort by, so it is read past rather than placed. */
        const methods = classBody.body.filter(
          (member): member is TSESTree.MethodDefinition => isMethod(member) && !member.computed,
        )
        let isFixOffered = false
        for (const [index, method] of methods.entries()) {
          const before = methods[index - 1]
          if (!before) continue
          const messageId = judge(before, method)
          if (!messageId) continue
          /* One fix sorts the whole class, so it rides on the first report and the rest carry none. */
          const fix = fixUnless(isFixOffered, ruleFixer => sortAll(ruleFixer, context.sourceCode, methods))
          isFixOffered = true
          context.report({
            node: method,
            messageId,
            data: { method: memberNameOf(method), previous: memberNameOf(before) },
            fix,
          })
        }
      },
    }

    return listener
  },
}

/**
 * What is wrong with two methods declared one after the other, if anything.
 *
 * A public method comes before a private one, and methods of the same visibility follow the
 * alphabet.
 *
 * @param before - The method declared first.
 * @param after - The method declared next.
 * @returns The message to report, or `null` when the order holds.
 */
const judge = (before: TSESTree.MethodDefinition, after: TSESTree.MethodDefinition): MethodOrderMessageId | null => {
  const wasPublic = isPublic(before)
  const isNowPublic = isPublic(after)
  if (!wasPublic && isNowPublic) return 'privateBeforePublic'
  if (wasPublic === isNowPublic && memberNameOf(before).localeCompare(memberNameOf(after)) > 0) return 'outOfOrder'

  return null
}

/**
 * The fix, unless the class already carries one.
 *
 * @param isOffered - Whether an earlier report of the class carries the fix.
 * @param fix - What sorts the class.
 * @returns The fix, and null where an earlier report carries it.
 */
const fixUnless = (isOffered: boolean, fix: TSESLint.ReportFixFunction): TSESLint.ReportFixFunction | null => {
  if (isOffered) return null

  return fix
}

/**
 * Puts every method of the class where the order wants it, in one fix: public before private, each block in the
 * alphabet. The methods trade places among the slots they hold, so what sits between them, a field or a method under
 * a computed key, stays where it is, and each method carries its comments with it.
 *
 * @param ruleFixer - What writes the fix.
 * @param sourceCode - The source the members are written in.
 * @param methods - The methods the order places, as the class declares them.
 * @returns The fix that sorts them.
 */
const sortAll = (
  ruleFixer: TSESLint.RuleFixer,
  sourceCode: TSESLint.SourceCode,
  methods: TSESTree.MethodDefinition[],
): TSESLint.RuleFix => {
  const slots = methods.map(method => ({ start: startOf(sourceCode, method), end: method.range[1] }))
  const text = [...methods]
    .sort(compare)
    .map((placed, index) => {
      const end = slots[index]?.end
      const between = sourceCode.text.slice(end, slots[index + 1]?.start ?? end)

      return `${sourceCode.text.slice(startOf(sourceCode, placed), placed.range[1])}${between}`
    })
    .join('')
  const start = Math.min(...slots.map(slot => slot.start))
  const end = Math.max(...slots.map(slot => slot.end))

  return ruleFixer.replaceTextRange([start, end], text)
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

/**
 * The order the class wants two methods in: public first, then the alphabet.
 *
 * @param left - One method.
 * @param right - The other.
 * @returns A negative number when the left one comes first, a positive one when it comes after, and zero for a tie.
 */
const compare = (left: TSESTree.MethodDefinition, right: TSESTree.MethodDefinition): number => {
  const visibility = Number(!isPublic(left)) - Number(!isPublic(right))
  if (visibility) return visibility

  return memberNameOf(left).localeCompare(memberNameOf(right))
}
