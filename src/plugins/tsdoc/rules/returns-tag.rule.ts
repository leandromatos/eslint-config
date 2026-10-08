import type { TSESLint } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { DocumentedNode, ReturningNode, ReturnsTagMessageId, TsdocRule } from '../types/index.js'
import {
  findDocBlock,
  handsValueBack,
  inheritsDoc,
  isConstructor,
  isOverloadImplementation,
  lineLocationOf,
  parseDocBlock,
} from '../utils/index.js'

/**
 * A documented function carries one `@returns` with a description when it hands a value back, and none when it does
 * not.
 *
 * Every function is read: one with a body, a declared one, a method without a body, an interface method and an
 * interface property typed as a function. A constructor builds the instance, so it is left out, and a comment that
 * inherits its documentation is not asked for the tag. A tag on a function that hands back `void`, `undefined` or
 * `never`, or a promise of one, is reported, async or not, and so is one on a generator that yields nothing. A second
 * tag is always one too many.
 */
export const returnsTag: TsdocRule<ReturnsTagMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A documented function carries one @returns with a description when it hands a value back, and none otherwise.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/returns-tag.md',
      dialects: ['TypeScript'],
    },
    messages: {
      missingReturns: 'The function hands a value back, and the comment carries no @returns.',
      unexpectedReturns: 'The function hands no value back, and the comment carries a @returns.',
      duplicateReturns: 'The comment carries more than one @returns.',
      missingReturnsDescription: 'The @returns carries no description.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const parserServices = ESLintUtils.getParserServices(context)
    const judge = (documented: DocumentedNode, node: ReturningNode): void => {
      const comment = findDocBlock(sourceCode, documented)
      if (!comment || isConstructor(node) || isOverloadImplementation(node)) return
      const docBlock = parseDocBlock(comment)
      const returnsTags = docBlock.tags.filter(docBlockTag => docBlockTag.tag === 'returns')
      for (const returnsTag of returnsTags.filter(docBlockTag => docBlockTag.description === ''))
        context.report({ loc: lineLocationOf(returnsTag.line), messageId: 'missingReturnsDescription' })
      if (returnsTags.length > 1) {
        context.report({ loc: comment.loc, messageId: 'duplicateReturns' })

        return
      }
      const isValue = handsValueBack(node, parserServices)
      if (returnsTags.length === 0 && isValue && !inheritsDoc(docBlock))
        context.report({ loc: comment.loc, messageId: 'missingReturns' })
      if (returnsTags.length === 1 && !isValue) context.report({ loc: comment.loc, messageId: 'unexpectedReturns' })
    }
    const judgeItself = (node: ReturningNode): void => judge(node, node)
    const listener: TSESLint.RuleListener = {
      ':function': judgeItself,
      TSDeclareFunction: judgeItself,
      TSEmptyBodyFunctionExpression: judgeItself,
      TSMethodSignature: judgeItself,
      TSPropertySignature: node => {
        const typeAnnotation = node.typeAnnotation?.typeAnnotation
        if (typeAnnotation?.type === AST_NODE_TYPES.TSFunctionType) judge(node, typeAnnotation)
      },
    }

    return listener
  },
}
