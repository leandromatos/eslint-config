import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { StringPattern, StringPatternMessageId, TextRule } from '../types/index.js'

/** What stands in for an expression inside a template literal, so a pattern can name it. */
const PLACEHOLDER = '{{value}}'

/**
 * A string handed to a known call looks the way the options say. Which call, which argument and
 * which shape are all options, so the rule knows nothing about what the strings are for; a
 * project says that a log line never ends with a period and an exception title always does.
 */
export const stringPattern: TextRule<StringPatternMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A string handed to a known call matches the pattern the options give for it.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/text/docs/rules/string-pattern.md',
      dialects: ['TypeScript'],
    },
    messages: {
      mustMatch: '"{{text}}" does not match /{{pattern}}/: {{because}}',
      mustNotMatch: '"{{text}}" matches /{{pattern}}/: {{because}}',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ stringPatterns }] = context.options
    const { sourceCode } = context
    const judge = (call: TSESTree.CallExpression | TSESTree.NewExpression): void => {
      const callee = calleeTextOf(call, sourceCode)
      const target = decoratedNameOf(call)
      for (const stringPattern of stringPatterns.filter(
        stringPattern => stringPattern.callee === callee && targets(stringPattern, target),
      )) {
        const literal = argumentOf(call, stringPattern.property)
        if (!literal) continue
        const text = textOf(literal)
        if (stringPattern.must && !new RegExp(stringPattern.must).test(text)) {
          context.report({
            node: literal,
            messageId: 'mustMatch',
            data: { text, pattern: stringPattern.must, because: stringPattern.because },
          })
        }
        if (stringPattern.mustNot && new RegExp(stringPattern.mustNot).test(text)) {
          context.report({
            node: literal,
            messageId: 'mustNotMatch',
            data: { text, pattern: stringPattern.mustNot, because: stringPattern.because },
          })
        }
      }
    }
    const listener: TSESLint.RuleListener = { CallExpression: judge, NewExpression: judge }

    return listener
  },
}

/**
 * Whether a pattern applies here: one without a target applies everywhere, one with a target only to a matching
 * declaration.
 *
 * @param stringPattern - The pattern the options declared.
 * @param target - The name of the declaration the call decorates, when it decorates one.
 * @returns Whether the pattern judges this string.
 */
const targets = (stringPattern: StringPattern, target: string | null): boolean => {
  if (!stringPattern.target) return true

  return target !== null && new RegExp(stringPattern.target).test(target)
}

/**
 * `createdAt` for `@ApiProperty({...}) createdAt`, and null for a call that decorates nothing.
 *
 * @param call - The call the rule reads.
 * @returns The decorated declaration's name.
 */
const decoratedNameOf = (call: TSESTree.CallExpression | TSESTree.NewExpression): string | null => {
  const decorator = call.parent
  if (decorator?.type !== AST_NODE_TYPES.Decorator) return null
  const declaration = decorator.parent
  if (declaration.type !== AST_NODE_TYPES.PropertyDefinition && declaration.type !== AST_NODE_TYPES.MethodDefinition)
    return null
  if (declaration.key.type !== AST_NODE_TYPES.Identifier) return null

  return declaration.key.name
}

/**
 * `this.logger.warn` for a call, `new NotFoundException` for a construction.
 *
 * @param call - The call the rule reads.
 * @param sourceCode - The source the call is written in.
 * @returns The callee as the author wrote it.
 */
const calleeTextOf = (
  call: TSESTree.CallExpression | TSESTree.NewExpression,
  sourceCode: TSESLint.SourceCode,
): string => {
  const text = sourceCode.getText(call.callee)
  if (call.type === AST_NODE_TYPES.NewExpression) return `new ${text}`

  return text
}

/**
 * The string the pattern judges: the first argument, or a property of it when one is named.
 *
 * @param call - The call the rule reads.
 * @param property - The property the pattern names, when it names one.
 * @returns The literal, and null where the call hands none.
 */
const argumentOf = (
  call: TSESTree.CallExpression | TSESTree.NewExpression,
  property: string | undefined,
): TSESTree.StringLiteral | TSESTree.TemplateLiteral | null => {
  const first = call.arguments[0]
  if (!first) return null
  if (!property) return asString(first)
  if (first.type !== AST_NODE_TYPES.ObjectExpression) return null
  const entry = first.properties.find(
    each =>
      each.type === AST_NODE_TYPES.Property &&
      each.key.type === AST_NODE_TYPES.Identifier &&
      each.key.name === property,
  )
  if (!entry || entry.type !== AST_NODE_TYPES.Property) return null

  return asString(entry.value)
}

/**
 * The node when it is a string, template included, and null for anything else.
 *
 * @param node - The node the rule reads.
 * @returns The literal.
 */
const asString = (node: TSESTree.Node): TSESTree.StringLiteral | TSESTree.TemplateLiteral | null => {
  if (node.type === AST_NODE_TYPES.TemplateLiteral) return node
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') return node

  return null
}

/**
 * The text a literal carries, with every expression of a template standing in as a placeholder.
 *
 * @param literal - The literal the rule judges.
 * @returns The text the pattern is matched against.
 */
const textOf = (literal: TSESTree.StringLiteral | TSESTree.TemplateLiteral): string => {
  if (literal.type === AST_NODE_TYPES.Literal) return literal.value

  return (
    literal.quasis
      /* v8 ignore start -- a template the parser read carries its cooked text */
      /* v8 ignore next -- a template the parser read carries its cooked text */
      .map(templateElement => templateElement.value.cooked ?? templateElement.value.raw)
      /* v8 ignore stop */
      .join(PLACEHOLDER)
  )
}
