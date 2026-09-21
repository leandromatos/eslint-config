import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, TSESLint } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ExpectedPrefixMessageId, NamingRule } from '../types/index.js'

const EXPECT = 'expect'
const PREFIX = 'expected'

/**
 * A value an assertion compares against is named `expected*`, so the test reads as what it
 * checks: `expect(result).toEqual(expectedUser)`. A literal or a call in that place needs no name.
 */
export const expectedPrefix: NamingRule<ExpectedPrefixMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A variable an assertion compares against is named expected*.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/naming/docs/rules/expected-prefix.md',
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    messages: {
      missingPrefix: '"{{name}}" is what the assertion compares against. Name it expected{{Name}}.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ testFolder, assertionMatchers, verbParticiples }] = context.options
    if (!where || !where.segments.includes(testFolder)) return {}
    const participles = Object.values(verbParticiples)
    const listener: TSESLint.RuleListener = {
      CallExpression: callExpression => {
        const matcher = matcherOf(callExpression)
        if (!matcher || !assertionMatchers.includes(matcher)) return
        const compared = callExpression.arguments[0]
        if (!compared || compared.type !== AST_NODE_TYPES.Identifier || compared.name.startsWith(PREFIX)) return
        const name = compared.name
        if (isConstantCase(name)) return
        const expected = `${PREFIX}${capitalize(withoutParticiple(name, participles))}`
        context.report({
          node: compared,
          messageId: 'missingPrefix',
          data: { name, Name: expected.slice(PREFIX.length) },
          fix: ruleFixer => renameDeclarationOf(ruleFixer, compared, expected, context.sourceCode),
        })
      },
    }

    return listener
  },
}

/**
 * A shared constant is not what one assertion expects; it keeps its name.
 *
 * @param name - The name as it is declared.
 * @returns Whether it is a constant.
 */
const isConstantCase = (name: string): boolean => /^[A-Z][A-Z0-9_]*$/.test(name)

/**
 * `activity` for `builtActivity`: the participle said where the value came from, and `expected` says what it is for.
 *
 * @param name - The name as it is declared.
 * @param participles - The participles a producing verb gives its result.
 * @returns The name without the participle.
 */
const withoutParticiple = (name: string, participles: string[]): string => {
  const participle = participles.find(each => name.startsWith(each) && /[A-Z]/.test(name.charAt(each.length)))
  if (!participle) return name
  const rest = name.slice(participle.length)

  return rest.charAt(0).toLowerCase() + rest.slice(1)
}

/**
 * The name with its first letter capitalized, so it reads as a word after the prefix.
 *
 * @param name - The name as it is declared.
 * @returns The name, capitalized.
 */
const capitalize = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1)

/**
 * Renames the variable the identifier resolves to, and every reference, when it is declared in
 * this file and the new name is free; `{ user }` becomes `{ user: expectedUser }`.
 *
 * @param ruleFixer - What writes the fix.
 * @param identifier - The name as the assertion writes it.
 * @param expected - The name the rule proposes.
 * @param sourceCode - The source it is written in.
 * @returns The fixes, and null where the variable is declared elsewhere or the name is taken.
 */
const renameDeclarationOf = (
  ruleFixer: TSESLint.RuleFixer,
  identifier: TSESTree.Identifier,
  expected: string,
  sourceCode: TSESLint.SourceCode,
): TSESLint.RuleFix[] | null => {
  const scope = sourceCode.getScope(identifier)
  const reference = scope.references.find(reference => reference.identifier === identifier)
  const variable = reference?.resolved
  /* v8 ignore next -- the scope resolved the name, so the variable it resolved to has a definition */
  const [definition] = variable?.defs ?? []
  if (!variable || !definition || definition.type !== TSESLint.Scope.DefinitionType.Variable) return null
  if (variable.scope.set.has(expected)) return null
  const identifiers = [...variable.identifiers, ...variable.references.map(reference => reference.identifier)]

  return identifiers
    .filter((node, index, all) => all.indexOf(node) === index)
    .map(node => {
      const parent = node.parent
      if (parent?.type === AST_NODE_TYPES.Property && parent.shorthand && parent.value === node)
        return ruleFixer.replaceText(parent, `${sourceCode.getText(parent.key)}: ${expected}`)

      return ruleFixer.replaceTextRange([node.range[0], node.range[0] + node.name.length], expected)
    })
}

/**
 * `toEqual` for `expect(x).toEqual(y)`, and null for a call that is not a matcher on an expect.
 *
 * @param callExpression - The call the rule reads.
 * @returns The matcher's name.
 */
const matcherOf = (callExpression: TSESTree.CallExpression): string | null => {
  const callee = callExpression.callee
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.property.type !== AST_NODE_TYPES.Identifier) return null
  let receiver: TSESTree.Node = callee.object
  while (receiver.type === AST_NODE_TYPES.MemberExpression) receiver = receiver.object
  if (receiver.type !== AST_NODE_TYPES.CallExpression) return null
  if (receiver.callee.type !== AST_NODE_TYPES.Identifier || receiver.callee.name !== EXPECT) return null

  return callee.property.name
}
