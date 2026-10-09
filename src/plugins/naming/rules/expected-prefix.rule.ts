import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, ASTUtils, TSESLint } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, locateFile, toUpperFirst } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ExpectedPrefixMessageId, NamingRule } from '../types/index.js'
import { removeParticiple, writeRename } from '../utils/index.js'

const EXPECT = 'expect'
const PREFIX = 'expected'

/** What declares a name the spec chooses: a variable, or a parameter of a helper that takes the expected value. */
const NAMED_DEFINITIONS = new Set<string>([
  TSESLint.Scope.DefinitionType.Variable,
  TSESLint.Scope.DefinitionType.Parameter,
])

/**
 * A value an assertion compares against is named `expected*`, so the test reads as what it
 * checks: `expect(result).toEqual(expectedUser)`. A literal or a call in that place needs no name, and neither does
 * a class, a function or a name the spec imports: the spec declares no variable for those, so there is nothing to
 * name.
 */
export const expectedPrefix: NamingRule<ExpectedPrefixMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A variable an assertion compares against is named expected*.',
      url: buildRuleDocsUrl('naming', 'expected-prefix'),
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
    const where = locateFile(context)
    const [{ testFolder, assertionMatchers, verbParticiples }] = context.options
    if (!where || !where.segments.includes(testFolder)) return {}
    const participles = Object.values(verbParticiples)
    const listener: TSESLint.RuleListener = {
      CallExpression: callExpression => {
        const matcher = readMatcherName(callExpression)
        if (!matcher || !assertionMatchers.includes(matcher)) return
        const compared = callExpression.arguments[0]
        if (!compared || compared.type !== AST_NODE_TYPES.Identifier || compared.name.startsWith(PREFIX)) return
        const name = compared.name
        if (isConstantCase(name) || !isSpecVariable(compared, context.sourceCode)) return
        const expected = `${PREFIX}${toUpperFirst(removeParticiple(name, participles))}`
        context.report({
          node: compared,
          messageId: 'missingPrefix',
          data: { name, Name: expected.slice(PREFIX.length) },
          fix: ruleFixer => renameComparedVariable(ruleFixer, compared, expected, context.sourceCode),
        })
      },
    }

    return listener
  },
}

/**
 * Whether the spec declares the name as a variable or a parameter, which is what the prefix names. A class, a
 * function and an import are declared elsewhere, or for something other than the assertion.
 *
 * @param identifier - The name the assertion compares against.
 * @param sourceCode - The source of the spec.
 * @returns Whether a variable or a parameter of the spec holds it.
 */
const isSpecVariable = (identifier: TSESTree.Identifier, sourceCode: TSESLint.SourceCode): boolean => {
  const variable = ASTUtils.findVariable(sourceCode.getScope(identifier), identifier)

  return Boolean(variable?.defs.some(definition => NAMED_DEFINITIONS.has(definition.type)))
}

/**
 * A shared constant is not what one assertion expects; it keeps its name.
 *
 * @param name - The name as it is declared.
 * @returns Whether it is a constant.
 */
const isConstantCase = (name: string): boolean => /^[A-Z][A-Z0-9_]*$/.test(name)

/**
 * Renames the variable the identifier resolves to, and every reference, when the spec declares it as a variable and
 * the new name is free; `{ user }` becomes `{ user: expectedUser }`.
 *
 * @param ruleFixer - What writes the fix.
 * @param identifier - The name as the assertion writes it.
 * @param expected - The name the rule proposes.
 * @param sourceCode - The source it is written in.
 * @returns The fixes, and null where the variable is declared elsewhere or the name is taken.
 */
const renameComparedVariable = (
  ruleFixer: TSESLint.RuleFixer,
  identifier: TSESTree.Identifier,
  expected: string,
  sourceCode: TSESLint.SourceCode,
): TSESLint.RuleFix[] | null => {
  const variable = ASTUtils.findVariable(sourceCode.getScope(identifier), identifier)
  if (!variable?.defs.some(definition => definition.type === TSESLint.Scope.DefinitionType.Variable)) return null
  if (variable.scope.set.has(expected)) return null
  const identifiers = [...variable.identifiers, ...variable.references.map(reference => reference.identifier)]

  return writeRename(ruleFixer, identifiers, expected, sourceCode)
}

/**
 * `toEqual` for `expect(x).toEqual(y)`, and null for a call that is not a matcher on an expect.
 *
 * @param callExpression - The call the rule reads.
 * @returns The matcher's name.
 */
const readMatcherName = (callExpression: TSESTree.CallExpression): string | null => {
  const callee = callExpression.callee
  if (callee.type !== AST_NODE_TYPES.MemberExpression || callee.property.type !== AST_NODE_TYPES.Identifier) return null
  let receiver: TSESTree.Node = callee.object
  while (receiver.type === AST_NODE_TYPES.MemberExpression) receiver = receiver.object
  if (receiver.type !== AST_NODE_TYPES.CallExpression) return null
  if (receiver.callee.type !== AST_NODE_TYPES.Identifier || receiver.callee.name !== EXPECT) return null

  return callee.property.name
}
