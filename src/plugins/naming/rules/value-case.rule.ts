import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { NamingRule, ValueCase, ValueCaseMessageId, ValueCasing } from '../types/index.js'

const CASINGS: Record<ValueCasing, RegExp> = {
  camelCase: /^[a-z][a-zA-Z0-9]*$/,
  'kebab-case': /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
}

/**
 * A string value keeps the casing its name promises. A queue name is a Redis key segment and a
 * job name is a hash field; which is which is said by the name the value is declared under, so
 * the rule reads the declaration's name and judges the literal it holds.
 */
export const valueCase: NamingRule<ValueCaseMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A string value declared under a governed name keeps the casing that name promises.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/naming/docs/rules/value-case.md',
      dialects: ['TypeScript'],
    },
    messages: {
      wrongCase:
        '"{{value}}" under "{{name}}" is not {{casing}}. A name ending in {{endsWith}} holds a {{casing}} value.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ valueCases }] = context.options
    const judge = (name: string, value: TSESTree.Expression | null): void => {
      const governing = valueCases.find(valueCase => name.endsWith(valueCase.endsWith))
      if (!governing || !value) return
      for (const stringLiteral of stringLiteralsOf(value, governing)) {
        if (CASINGS[governing.casing].test(stringLiteral.value)) continue
        const wrongCase = { value: stringLiteral.value, name, casing: governing.casing, endsWith: governing.endsWith }
        context.report({ node: stringLiteral, messageId: 'wrongCase', data: wrongCase })
      }
    }
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => {
        if (node.id.type === AST_NODE_TYPES.Identifier) judge(node.id.name, node.init)
      },
      PropertyDefinition: node => {
        if (node.key.type === AST_NODE_TYPES.Identifier) judge(node.key.name, node.value)
      },
    }

    return listener
  },
}

/**
 * The string literals a value holds: the literal itself, or, when deep, those of its object.
 *
 * @param value - What the declaration holds.
 * @param valueCase - The casing the name promises, and whether it reaches into an object.
 * @returns The literals the rule judges.
 */
const stringLiteralsOf = (value: TSESTree.Expression, valueCase: ValueCase): TSESTree.StringLiteral[] => {
  const unwrapped = unwrapAssertion(value)
  if (isStringLiteral(unwrapped)) return [unwrapped]
  if (!valueCase.deep || unwrapped.type !== AST_NODE_TYPES.ObjectExpression) return []

  return unwrapped.properties.flatMap(property => {
    if (property.type !== AST_NODE_TYPES.Property) return []
    const inner = unwrapAssertion(property.value as TSESTree.Expression)
    if (!isStringLiteral(inner)) return []

    return [inner]
  })
}

/**
 * `'x' as const` is the literal underneath.
 *
 * @param value - What the declaration holds.
 * @returns The expression the assertion wraps.
 */
const unwrapAssertion = (value: TSESTree.Expression): TSESTree.Expression => {
  if (value.type === AST_NODE_TYPES.TSAsExpression) return value.expression

  return value
}

const isStringLiteral = (value: TSESTree.Expression): value is TSESTree.StringLiteral =>
  value.type === AST_NODE_TYPES.Literal && typeof value.value === 'string'
