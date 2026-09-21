import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, EffectInHookMessageId } from '../types/index.js'

/**
 * An effect is written in a hook of its own, never in the component that renders.
 *
 * React needs an effect to synchronize with something outside React, and a component reads better when that
 * synchronization has a name: `useSessionTimeout` says what it does, while a bare `useEffect` in the middle of a
 * component says only that something happens. The hook is also the one place a test can reach it.
 *
 * What the rule does not judge is whether the effect is needed at all. A value derived from props is computed while
 * rendering and a reaction to a click belongs in the handler, and neither is a question a file path can answer.
 */
export const effectInHook: ArchitectureRule<EffectInHookMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'An effect is written in a hook of its own, never in the component that renders.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/effect-in-hook.md',
      dialects: ['TypeScript'],
    },
    messages: {
      effectOutsideHook:
        '"{{name}}" is called in a file of the {{suffix}} layer. Move it to a hook of its own, whose name says what it synchronizes.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ suffixToFolder, effectHooks }] = context.options
    const hookSuffix = Object.keys(suffixToFolder).find(suffix => suffix === 'hook')
    if (!where || effectHooks.length === 0 || !hookSuffix) return {}
    if (where.suffix === hookSuffix) return {}
    const listener: TSESLint.RuleListener = {
      CallExpression: callExpression => {
        const name = calleeNameOf(callExpression)
        if (!name || !effectHooks.includes(name)) return
        context.report({
          node: callExpression,
          messageId: 'effectOutsideHook',
          data: { name, suffix: where.suffix ?? 'unsuffixed' },
        })
      },
    }

    return listener
  },
}

/**
 * The name a call names: `useEffect` for `useEffect(...)` and for `React.useEffect(...)`.
 *
 * @param callExpression - The call.
 * @returns The name, and null for a call of something the source does not name.
 */
const calleeNameOf = (callExpression: TSESTree.CallExpression): string | null => {
  const { callee } = callExpression
  if (callee.type === AST_NODE_TYPES.Identifier) return callee.name
  if (callee.type === AST_NODE_TYPES.MemberExpression && callee.property.type === AST_NODE_TYPES.Identifier)
    return callee.property.name

  return null
}
