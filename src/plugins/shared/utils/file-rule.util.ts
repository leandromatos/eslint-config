import type { TSESLint } from '@typescript-eslint/utils'
import type { JSONSchema4 } from '@typescript-eslint/utils/json-schema'

import type { Judge, PluginRule } from '../types/index.js'
import { locate } from './locate.util.js'

/**
 * A rule that judges the file as a whole and reports once, on `Program`.
 *
 * @param description - What the rule holds true, for the rule's docs.
 * @param url - Where the rule is documented, which an editor shows beside the report.
 * @param messages - The messages the judge reports, by ID.
 * @param judge - What reads the location and answers the findings.
 * @param jsonSchema4 - What a configuration of this plugin has to hand the rule.
 * @param emptyOptions - What the rule runs with when a configuration hands it none.
 * @returns The rule.
 */
export const fileRule = <TMessageId extends string, TOptions>(
  description: string,
  url: string,
  messages: Record<TMessageId, string>,
  judge: Judge<TMessageId, TOptions>,
  jsonSchema4: JSONSchema4,
  emptyOptions: TOptions,
): PluginRule<TMessageId, TOptions> => {
  const meta: PluginRule<TMessageId, TOptions>['meta'] = {
    type: 'problem',
    docs: { description, url, dialects: ['TypeScript'] },
    messages,
    schema: [jsonSchema4],
    defaultOptions: [emptyOptions],
  }
  const create: PluginRule<TMessageId, TOptions>['create'] = context => {
    const where = locate(context)
    if (!where) return {}
    const [options] = context.options
    const listener: TSESLint.RuleListener = {
      Program: program => {
        for (const finding of judge(where, options, context))
          context.report({ node: program, messageId: finding.messageId, data: finding.data })
      },
    }

    return listener
  }

  return { meta, create }
}
