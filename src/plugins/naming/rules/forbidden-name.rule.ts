import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ForbiddenNameMessageId, NamingRule } from '../types/index.js'

/**
 * A name the conventions forbid outright, wherever the author chose it.
 *
 * What the author chooses is a declaration: a variable, a parameter, a function, a class, a property of a class. A
 * key of an object literal is not one of those. It is half of a contract the code is filling in, and `report({ data
 * })` spells `data` because ESLint asked for it, not because anybody named a value that way.
 */
export const forbiddenName: NamingRule<ForbiddenNameMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A name the conventions forbid is never declared.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/naming/docs/rules/forbidden-name.md',
      dialects: ['TypeScript'],
    },
    messages: {
      forbidden: '"{{name}}" says what the value is made of rather than what it is. Name it after what it holds.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ forbiddenNames }] = context.options
    const judge = (identifier: TSESTree.Identifier | null): void => {
      if (!identifier || !forbiddenNames.includes(identifier.name)) return
      context.report({ node: identifier, messageId: 'forbidden', data: { name: identifier.name } })
    }
    const listener: TSESLint.RuleListener = {
      VariableDeclarator: node => judge(identifierOf(node.id)),
      FunctionDeclaration: node => judge(node.id),
      ClassDeclaration: node => judge(node.id),
      PropertyDefinition: node => judge(identifierOf(node.key)),
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': node => {
        const { params } = node as TSESTree.FunctionLike
        for (const parameter of params) judge(identifierOf(parameter))
      },
    }

    return listener
  },
}

/**
 * The identifier a node declares, and null for a pattern that declares none.
 *
 * A destructured parameter declares the keys of whatever it takes apart, and those are the contract's names rather
 * than the author's.
 *
 * @param node - What the declaration names.
 * @returns The identifier.
 */
const identifierOf = (node: TSESTree.Node): TSESTree.Identifier | null => {
  if (node.type === AST_NODE_TYPES.Identifier) return node
  if (node.type === AST_NODE_TYPES.AssignmentPattern) return identifierOf(node.left)

  return null
}
