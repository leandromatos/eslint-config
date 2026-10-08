import type { TSESLint } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA, SENTENCE_TAGS } from '../constants/index.js'
import type { DescriptionSentenceMessageId, DocumentedNode, TsdocRule } from '../types/index.js'
import { findDocBlock, lineLocationOf, parseDocBlock } from '../utils/index.js'

/**
 * What a description reads as: a capital, a digit, an underscore or a backtick first, and a period, a question mark,
 * an exclamation mark, a backtick or an emoji last. Nothing at all passes too.
 */
const SENTENCE_REG_EXP = /^\n?([A-Z`\d_][\s\S]*[.?!`\p{RGI_Emoji}]\s*)?$/v

/**
 * The main description of a documented function, and the text of its `@param`, `@returns` and `@throws`, read as
 * sentences. A method without a body, an interface method and an interface property typed as a function are read as a
 * function is.
 *
 * A sentence opens with a capital and closes with its punctuation, so a reader meets the same shape in every comment.
 * A backtick may open or close one, which lets a sentence start with a name in code or end on a code fence. A tag whose
 * text is a bare hyphen, and a description that is empty, are left to the rules that ask for text.
 */
export const descriptionSentence: TsdocRule<DescriptionSentenceMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'The description of a documented function and the text of its tags read as sentences.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/description-sentence.md',
      dialects: ['TypeScript'],
    },
    messages: {
      notSentence:
        'The {{part}} does not read as a sentence: it opens with a capital, a digit, an underscore or a backtick, and closes with a period, a question mark, an exclamation mark or a backtick.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const judge = (node: DocumentedNode): void => {
      const comment = findDocBlock(sourceCode, node)
      if (!comment) return
      const docBlock = parseDocBlock(comment)
      if (!SENTENCE_REG_EXP.test(docBlock.description))
        context.report({
          loc: lineLocationOf(docBlock.descriptionLine),
          messageId: 'notSentence',
          data: { part: 'description' },
        })
      for (const docBlockTag of docBlock.tags) {
        if (!SENTENCE_TAGS.has(docBlockTag.tag) || docBlockTag.description === '-') continue
        if (SENTENCE_REG_EXP.test(docBlockTag.description)) continue
        context.report({
          loc: lineLocationOf(docBlockTag.line),
          messageId: 'notSentence',
          data: { part: `text of @${docBlockTag.tag}` },
        })
      }
    }
    const listener: TSESLint.RuleListener = {
      ':function': judge,
      TSDeclareFunction: judge,
      TSEmptyBodyFunctionExpression: judge,
      TSMethodSignature: judge,
      TSPropertySignature: node => {
        if (node.typeAnnotation?.typeAnnotation.type === AST_NODE_TYPES.TSFunctionType) judge(node)
      },
    }

    return listener
  },
}
