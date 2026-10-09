import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { buildRuleDocsUrl } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { CompiledStringPattern, StringPattern, StringPatternMessageId, TextRule } from '../types/index.js'

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
      url: buildRuleDocsUrl('text', 'string-pattern'),
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
    const compiledPatterns = stringPatterns.map(compileStringPattern)
    const judge = (call: TSESTree.CallExpression | TSESTree.NewExpression): void => {
      const callee = readCalleeText(call, sourceCode)
      const target = readDecoratedName(call)
      const governing = compiledPatterns.filter(
        compiledPattern => compiledPattern.callee === callee && isTargeted(compiledPattern, target),
      )
      for (const compiledPattern of governing) {
        const literal = findPatternArgument(call, compiledPattern.property)
        if (!literal) continue
        const text = readLiteralText(literal)
        const { because, must, mustNot } = compiledPattern
        if (must && !must.test(text))
          context.report({ node: literal, messageId: 'mustMatch', data: { text, pattern: must.source, because } })
        if (mustNot?.test(text))
          context.report({ node: literal, messageId: 'mustNotMatch', data: { text, pattern: mustNot.source, because } })
      }
    }
    const listener: TSESLint.RuleListener = { CallExpression: judge, NewExpression: judge }

    return listener
  },
}

/**
 * Compiles the regular expressions of a pattern once, so a file is judged without building them again per call.
 *
 * @param stringPattern - The pattern the options declared.
 * @returns The pattern, with its expressions built.
 */
const compileStringPattern = (stringPattern: StringPattern): CompiledStringPattern => {
  const { callee, property, because } = stringPattern
  const target = compileOptionalRegExp(stringPattern.target)
  const must = compileOptionalRegExp(stringPattern.must)
  const mustNot = compileOptionalRegExp(stringPattern.mustNot)
  const compiledPattern: CompiledStringPattern = { callee, property, because, target, must, mustNot }

  return compiledPattern
}

/**
 * Compiles a regular expression the options give as its source, when they give one.
 *
 * @param source - The source of the expression.
 * @returns The expression, and nothing when the options give none.
 */
const compileOptionalRegExp = (source: string | undefined): RegExp | undefined => {
  if (source === undefined) return undefined

  return new RegExp(source)
}

/**
 * Whether a pattern applies here: one without a target applies everywhere, one with a target only to a matching
 * declaration.
 *
 * @param compiledPattern - The pattern, with its expressions built.
 * @param target - The name of the declaration the call decorates, when it decorates one.
 * @returns Whether the pattern judges this string.
 */
const isTargeted = (compiledPattern: CompiledStringPattern, target: string | null): boolean => {
  if (!compiledPattern.target) return true

  return target !== null && compiledPattern.target.test(target)
}

/**
 * `createdAt` for `@ApiProperty({...}) createdAt`, and null for a call that decorates nothing.
 *
 * @param call - The call the rule reads.
 * @returns The decorated declaration's name.
 */
const readDecoratedName = (call: TSESTree.CallExpression | TSESTree.NewExpression): string | null => {
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
const readCalleeText = (
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
const findPatternArgument = (
  call: TSESTree.CallExpression | TSESTree.NewExpression,
  property: string | undefined,
): TSESTree.StringLiteral | TSESTree.TemplateLiteral | null => {
  const first = call.arguments[0]
  if (!first) return null
  if (!property) return readStringNode(first)
  if (first.type !== AST_NODE_TYPES.ObjectExpression) return null
  const entry = first.properties.find(
    each =>
      each.type === AST_NODE_TYPES.Property &&
      each.key.type === AST_NODE_TYPES.Identifier &&
      each.key.name === property,
  )
  if (!entry || entry.type !== AST_NODE_TYPES.Property) return null

  return readStringNode(entry.value)
}

/**
 * The node when it is a string, template included, and null for anything else.
 *
 * @param node - The node the rule reads.
 * @returns The literal.
 */
const readStringNode = (node: TSESTree.Node): TSESTree.StringLiteral | TSESTree.TemplateLiteral | null => {
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
const readLiteralText = (literal: TSESTree.StringLiteral | TSESTree.TemplateLiteral): string => {
  if (literal.type === AST_NODE_TYPES.Literal) return literal.value

  return literal.quasis.map(templateElement => templateElement.value.raw).join(PLACEHOLDER)
}
