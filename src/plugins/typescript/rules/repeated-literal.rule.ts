import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { PluginRule } from '../../shared/types/index.js'
import { buildRuleDocsUrl, isInsideTableRow } from '../../shared/utils/index.js'
import { DEFAULT_REPEATED_LITERAL_OPTIONS, REPEATED_LITERAL_SCHEMA } from '../constants/index.js'
import type { RepeatedLiteralMessageId, RepeatedLiteralOptions } from '../types/index.js'

/** Where a string names something other than a value: a module it imports, a key, a type, a directive. */
const NAMING_PARENTS = new Set<string>([
  AST_NODE_TYPES.ExportAllDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ExpressionStatement,
  AST_NODE_TYPES.ImportDeclaration,
  AST_NODE_TYPES.ImportExpression,
  AST_NODE_TYPES.TSLiteralType,
  AST_NODE_TYPES.TSEnumMember,
])

/**
 * A value of the configuration is written once in its file, and every list that names it reads the constant.
 *
 * A word written twice is two words that happen to agree: the day one of them changes, the lists that named it stop
 * agreeing, and nothing reports it. `sonarjs/no-duplicate-string` leaves out a string shorter than ten characters or
 * written without a separator, and those are exactly the folder names and suffixes a configuration lists. This rule
 * takes the options that one takes, `threshold` and `ignoreStrings`, counts every string, and leaves which files it
 * reads to the configuration's `files`. The fields of a row of a table are left alone, since what repeats down a
 * column is the shape of the table.
 */
export const repeatedLiteral: PluginRule<RepeatedLiteralMessageId, RepeatedLiteralOptions> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'A string of a constant file is written once, and every other use reads the constant.',
      url: buildRuleDocsUrl('typescript', 'repeated-literal'),
      dialects: ['TypeScript'],
    },
    messages: {
      repeatedLiteral:
        '"{{value}}" is written {{count}} times in this file. Declare it once, as a constant, and read it everywhere.',
    },
    schema: [REPEATED_LITERAL_SCHEMA],
    defaultOptions: [DEFAULT_REPEATED_LITERAL_OPTIONS],
  },
  create: context => {
    const [{ threshold, ignoreStrings }] = context.options
    const ignored = new Set(ignoreStrings.split(',').map(ignoredString => ignoredString.trim()))
    const literalsByValue = new Map<string, TSESTree.StringLiteral[]>()
    const listener: TSESLint.RuleListener = {
      Literal: literal => {
        if (typeof literal.value !== 'string' || literal.value === '' || isNamingString(literal)) return
        if (ignored.has(literal.value)) return
        if (isInsideTableRow(literal)) return
        const literals = literalsByValue.get(literal.value) ?? []
        literalsByValue.set(literal.value, [...literals, literal])
      },
      'Program:exit': () => {
        for (const [value, literals] of literalsByValue) {
          if (literals.length < threshold) continue
          const count = String(literals.length)
          for (const literal of literals.slice(1))
            context.report({ node: literal, messageId: 'repeatedLiteral', data: { value, count } })
        }
      },
    }

    return listener
  },
}

/**
 * Whether a string names something rather than holding a value: the source of an import, a key, a type, a directive.
 *
 * @param literal - The string.
 * @returns Whether it names something.
 */
const isNamingString = (literal: TSESTree.Literal): boolean => {
  const { parent } = literal
  if (NAMING_PARENTS.has(parent.type)) return true
  if (parent.type === AST_NODE_TYPES.Property || parent.type === AST_NODE_TYPES.PropertyDefinition)
    return parent.key === literal

  return false
}
