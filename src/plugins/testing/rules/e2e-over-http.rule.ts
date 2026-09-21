import type { TSESLint } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { E2eOverHttpMessageId, TestingRule } from '../types/index.js'

/**
 * A spec of the end-to-end kind sends requests: it imports the HTTP client the options name. A
 * spec in that folder that takes a provider out of the module and calls it exercises no route,
 * and is a unit test that borrowed the database.
 */
export const e2eOverHttp: TestingRule<E2eOverHttpMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A spec of the end-to-end kind imports the HTTP client.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/testing/docs/rules/e2e-over-http.md',
      dialects: ['TypeScript'],
    },
    messages: {
      noRequest:
        'This spec sits in "{{kind}}" and never imports "{{client}}". An end-to-end spec goes through HTTP; one that calls a provider is a unit test in the wrong folder.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ testFolder, httpTest, suffixToFolder }] = context.options
    if (!where || !httpTest.kind) return {}
    const at = where.segments.indexOf(testFolder)
    if (at < 0 || where.segments[at + 1] !== httpTest.kind) return {}
    // The kind holds its helpers beside its specs, and a helper sends nothing on its own.
    const testSuffix = Object.keys(suffixToFolder).find(key => suffixToFolder[key] === testFolder)
    if (where.suffix !== testSuffix) return {}
    let importsClient = false
    const listener: TSESLint.RuleListener = {
      ImportDeclaration: importDeclaration => {
        if (importDeclaration.source.value === httpTest.client) importsClient = true
      },
      'Program:exit': program => {
        if (importsClient) return
        context.report({
          node: program,
          messageId: 'noRequest',
          data: { kind: httpTest.kind, client: httpTest.client },
        })
      },
    }

    return listener
  },
}
