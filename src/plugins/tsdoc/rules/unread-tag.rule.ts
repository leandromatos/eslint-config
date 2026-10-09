import type { TSESLint } from '@typescript-eslint/utils'

import { buildRuleDocsUrl } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { TsdocRule, UnreadTagMessageId } from '../types/index.js'
import { buildLineLocation, isDocComment, parseDocBlock } from '../utils/index.js'

/** The release tags of TSDoc, which a tool reads to trim the declarations a package publishes. */
const RELEASE_TAGS = new Set(['public', 'internal', 'alpha', 'beta'])

/**
 * A comment carries no tag that nothing reads.
 *
 * `@override` restates the `override` keyword, which the compiler already reads, so it is reported always. A release
 * tag is read by TypeDoc or API Extractor, and without one of them it claims a pipeline that does not exist, so it is
 * reported unless `readsReleaseTags` says the project runs one.
 */
export const unreadTag: TsdocRule<UnreadTagMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A comment carries no tag that nothing reads: @override always, and a release tag with no tool for it.',
      url: buildRuleDocsUrl('tsdoc', 'unread-tag'),
      dialects: ['TypeScript'],
    },
    messages: {
      overrideTag: 'The @override restates the override keyword, which the compiler already reads.',
      releaseTag:
        'The @{{tag}} is a release tag, and nothing in the project reads one. Set readsReleaseTags where TypeDoc or API Extractor runs.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ readsReleaseTags }] = context.options
    const { sourceCode } = context
    const listener: TSESLint.RuleListener = {
      Program: () => {
        for (const comment of sourceCode.getAllComments().filter(isDocComment))
          for (const docBlockTag of parseDocBlock(comment).tags) {
            if (docBlockTag.tag === 'override')
              context.report({ loc: buildLineLocation(docBlockTag.line), messageId: 'overrideTag' })
            if (RELEASE_TAGS.has(docBlockTag.tag) && !readsReleaseTags)
              context.report({
                loc: buildLineLocation(docBlockTag.line),
                messageId: 'releaseTag',
                data: { tag: docBlockTag.tag },
              })
          }
      },
    }

    return listener
  },
}
