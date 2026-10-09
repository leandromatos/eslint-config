import type { TSESLint } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, locateFile, readCalleeName } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, HOOK_SUFFIX, OPTIONS_SCHEMA } from '../constants/index.js'
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
      url: buildRuleDocsUrl('architecture', 'effect-in-hook'),
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
    const where = locateFile(context)
    const [{ suffixToFolder, effectHooks }] = context.options
    if (!where || effectHooks.length === 0 || !(HOOK_SUFFIX in suffixToFolder)) return {}
    if (where.suffix === HOOK_SUFFIX) return {}
    const listener: TSESLint.RuleListener = {
      CallExpression: callExpression => {
        const name = readCalleeName(callExpression)
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
