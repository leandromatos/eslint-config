import type { TSESLint } from '@typescript-eslint/utils'

import { buildRuleDocsUrl } from '../../shared/utils/build-rule-docs-url.util.js'
import { findTestSuffix } from '../../shared/utils/find-test-suffix.util.js'
import { locateFile } from '../../shared/utils/locate-file.util.js'
import { OPTIONS_SCHEMA } from '../constants/options.constant.js'
import { EMPTY_OPTIONS } from '../constants/testing.constant.js'
import type { E2eOverHttpMessageId } from '../types/rules/e2e-over-http.rule.type.js'
import type { TestingRule } from '../types/testing.type.js'

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
      url: buildRuleDocsUrl('testing', 'e2e-over-http'),
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
    const where = locateFile(context)
    const [{ testFolder, httpTest, suffixToFolder }] = context.options
    if (!where || !httpTest) return {}
    const at = where.segments.indexOf(testFolder)
    if (at < 0 || where.segments[at + 1] !== httpTest.kind) return {}
    // The kind holds its helpers beside its specs, and a helper sends nothing on its own.
    if (where.suffix !== findTestSuffix(suffixToFolder, testFolder)) return {}
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
