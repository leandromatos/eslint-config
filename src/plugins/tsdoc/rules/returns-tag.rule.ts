import type { TSESLint } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { DescribedFunction, ReturningNode, ReturnsTagMessageId, TsdocRule } from '../types/index.js'
import {
  findDocBlock,
  hasReturnValue,
  hasValueToDocument,
  inheritsDoc,
  isConstructor,
  isDescribedFunction,
  lineLocationOf,
  parseDocBlock,
} from '../utils/index.js'

/**
 * A documented function carries one `@returns` with a description when it hands a value back, and none when it does
 * not.
 *
 * The tag is asked for in the kinds of function `requiredTagContexts` names. A constructor builds the instance, and a
 * comment that inherits its documentation documents nothing here, so neither is asked. A tag on a function that hands
 * nothing back is reported, except on an async function or a generator, whose value is a promise or an iterator either
 * way. A second tag is always one too many.
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
    const [{ requiredTagContexts }] = context.options
    const { sourceCode } = context
    const judge = (node: ReturningNode): void => {
      const comment = findDocBlock(sourceCode, node)
      if (!comment) return
      const docBlock = parseDocBlock(comment)
      const returnsTags = docBlock.tags.filter(docBlockTag => docBlockTag.tag === 'returns')
      const isRequired = requiredTagContexts.includes(node.type) && !isConstructor(node) && !inheritsDoc(docBlock)
      const isChecked = isDescribedFunction(node) && !isConstructor(node) && !yieldsLater(node)
      if (isDescribedFunction(node))
        for (const returnsTag of returnsTags.filter(docBlockTag => docBlockTag.description === ''))
          context.report({ loc: lineLocationOf(returnsTag.line), messageId: 'missingReturnsDescription' })
      if (returnsTags.length > 1) {
        if (isRequired || isChecked) context.report({ loc: comment.loc, messageId: 'duplicateReturns' })

        return
      }
      if (returnsTags.length === 0 && isRequired && hasValueToDocument(node))
        context.report({ loc: comment.loc, messageId: 'missingReturns' })
      if (returnsTags.length === 1 && isChecked && !hasReturnValue(node))
        context.report({ loc: comment.loc, messageId: 'unexpectedReturns' })
    }
    const listener: TSESLint.RuleListener = {
      ':function': judge,
      TSDeclareFunction: judge,
      TSMethodSignature: judge,
    }

    return listener
  },
}

/**
 * Whether a function hands back a promise or an iterator whatever its body returns: an async function or a generator.
 *
 * @param node - The function.
 * @returns Whether its value comes later.
 */
const yieldsLater = (node: DescribedFunction): boolean => node.async || node.generator
