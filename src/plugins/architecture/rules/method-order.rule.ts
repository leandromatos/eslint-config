import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, isMethod, isPublic, locateFile, readMemberName } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, MethodOrderMessageId, NamedMethod } from '../types/index.js'

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
      url: buildRuleDocsUrl('architecture', 'method-order'),
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
    const where = locateFile(context)
    const [{ orderedSuffixes }] = context.options
    if (!where?.suffix || !orderedSuffixes.includes(where.suffix)) return {}
    const listener: TSESLint.RuleListener = {
      ClassBody: classBody => {
        const methods = listNamedMethods(classBody)
        let isFixOffered = false
        for (const [index, method] of methods.entries()) {
          const before = methods[index - 1]
          if (!before) continue
          const messageId = judge(before, method)
          if (!messageId) continue
          // One fix sorts the whole class, so it rides on the first report and the rest carry none.
          const fix = offerFixOnce(isFixOffered, ruleFixer => sortClassMethods(ruleFixer, context.sourceCode, methods))
          isFixOffered = true
          context.report({ node: method.node, messageId, data: { method: method.name, previous: before.name }, fix })
        }
      },
    }

    return listener
  },
}

/**
 * Lists the methods of a class body the order places, each with its name. A method under a computed key has no name
 * to sort by, so it is read past rather than placed, and a field between two methods stays where it is.
 *
 * @param classBody - The body of the class.
 * @returns The methods, as the class declares them.
 */
const listNamedMethods = (classBody: TSESTree.ClassBody): NamedMethod[] =>
  classBody.body.flatMap(member => {
    if (!isMethod(member)) return []
    const name = readMemberName(member)
    if (name === null) return []
    const namedMethod: NamedMethod = { node: member, name, isPublic: isPublic(member) }

    return [namedMethod]
  })

/**
 * Judges two methods declared one after the other.
 *
 * A public method comes before a private one, and methods of the same visibility follow the alphabet.
 *
 * @param before - The method declared first.
 * @param after - The method declared next.
 * @returns The message to report, or `null` when the order holds.
 */
const judge = (before: NamedMethod, after: NamedMethod): MethodOrderMessageId | null => {
  if (!before.isPublic && after.isPublic) return 'privateBeforePublic'
  if (before.isPublic === after.isPublic && compareNames(before.name, after.name) > 0) return 'outOfOrder'

  return null
}

/**
 * Offers the fix, unless the class already carries one.
 *
 * @param isOffered - Whether an earlier report of the class carries the fix.
 * @param fix - What sorts the class.
 * @returns The fix, and null where an earlier report carries it.
 */
const offerFixOnce = (isOffered: boolean, fix: TSESLint.ReportFixFunction): TSESLint.ReportFixFunction | null => {
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
const sortClassMethods = (
  ruleFixer: TSESLint.RuleFixer,
  sourceCode: TSESLint.SourceCode,
  methods: NamedMethod[],
): TSESLint.RuleFix => {
  const slots = methods.map(method => [findMemberStart(sourceCode, method.node), method.node.range[1]] as const)
  const ends = [...slots.map(([, end]) => end)]
  const starts = [...slots.slice(1).map(([start]) => start), Math.max(...ends)]
  const text = [...methods]
    .sort(compareMethods)
    .map((placed, index) => {
      const between = sourceCode.text.slice(ends[index], starts[index])

      return `${sourceCode.text.slice(findMemberStart(sourceCode, placed.node), placed.node.range[1])}${between}`
    })
    .join('')
  const start = Math.min(...slots.map(([slotStart]) => slotStart))
  const end = Math.max(...ends)

  return ruleFixer.replaceTextRange([start, end], text)
}

/**
 * Finds where a member starts, its leading comments included, so a doc block travels with its method.
 *
 * @param sourceCode - The source the member is written in.
 * @param member - The member the class declares.
 * @returns The offset the member opens at.
 */
const findMemberStart = (sourceCode: TSESLint.SourceCode, member: TSESTree.MethodDefinition): number => {
  const [first] = sourceCode.getCommentsBefore(member)
  if (!first) return member.range[0]

  return first.range[0]
}

/**
 * Compares two methods in the order the class wants them: public first, then the alphabet.
 *
 * @param left - One method.
 * @param right - The other.
 * @returns A negative number when the left one comes first, a positive one when it comes after, and zero for a tie.
 */
const compareMethods = (left: NamedMethod, right: NamedMethod): number => {
  const visibility = Number(!left.isPublic) - Number(!right.isPublic)
  if (visibility) return visibility

  return compareNames(left.name, right.name)
}

/**
 * Compares two names by the English alphabet, whatever the locale of the machine the linter runs on, so a fix written
 * on one machine is the order another one reads.
 *
 * @param left - One name.
 * @param right - The other.
 * @returns A negative number when the left one comes first, a positive one when it comes after, and zero for a tie.
 */
const compareNames = (left: string, right: string): number => left.localeCompare(right, 'en')
