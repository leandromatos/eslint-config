import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, ArgumentPassedWholeMessageId } from '../types/index.js'

/**
 * A layer that receives an object the options name passes it on whole, never a field of it.
 * `service.deleteUser(params)` survives the route growing a second parameter, and every call
 * site keeps saying which layer it talks to; `service.deleteUser(params.userId)` does neither.
 */
export const argumentPassedWhole: ArchitectureRule<ArgumentPassedWholeMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A named object is passed on whole, not a field of it.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/argument-passed-whole.md',
      dialects: ['TypeScript'],
    },
    messages: {
      unwrapped:
        '"{{argument}}" unwraps {{object}}. This layer passes {{object}} on whole; the next one reads the field.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ wholeArguments }] = context.options
    const governing = wholeArguments.find(wholeArgument => wholeArgument.suffix === where?.suffix)
    if (!governing) return {}
    const listener: TSESLint.RuleListener = {
      CallExpression: callExpression => {
        for (const argument of callExpression.arguments) {
          const object = unwrappedObjectOf(argument, governing.objects)
          if (!object) continue
          context.report({
            node: argument,
            messageId: 'unwrapped',
            data: { argument: context.sourceCode.getText(argument), object },
          })
        }
      },
    }

    return listener
  },
}

/**
 * The governed object an argument reads a field of, when it does: `params` for `params.userId`.
 *
 * @param argument - What the call is handed.
 * @param objects - The objects this layer passes on whole.
 * @returns The object's name, and null for an argument that unwraps nothing.
 */
const unwrappedObjectOf = (argument: TSESTree.CallExpressionArgument, objects: string[]): string | null => {
  if (argument.type !== AST_NODE_TYPES.MemberExpression) return null
  if (argument.object.type !== AST_NODE_TYPES.Identifier || !objects.includes(argument.object.name)) return null

  return argument.object.name
}
