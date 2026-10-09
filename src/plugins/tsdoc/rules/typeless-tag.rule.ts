import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

import { buildRuleDocsUrl } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA, TYPED_TAGS } from '../constants/index.js'
import type { DocBlockTag, TsdocRule, TypelessTagMessageId } from '../types/index.js'
import { buildLineLocation, isDocComment, parseDocBlock } from '../utils/index.js'

/**
 * A `@param` or a `@returns` carries no type in braces.
 *
 * TypeScript declares the type in the signature, and TSDoc writes none in the comment, so a type there repeats the
 * signature and goes stale when it changes. The rule reads every documentation comment of the file. `@throws` is the
 * business of `tsdoc/throws-tag`.
 */
export const typelessTag: TsdocRule<TypelessTagMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A @param or a @returns carries no type in braces.',
      url: buildRuleDocsUrl('tsdoc', 'typeless-tag'),
      dialects: ['TypeScript'],
    },
    fixable: 'code',
    messages: {
      typedTag: 'The @{{tag}} carries a type in braces. TypeScript declares the type, and TSDoc writes none.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const judge = (comment: TSESTree.Comment): void => {
      for (const docBlockTag of parseDocBlock(comment).tags) {
        if (!TYPED_TAGS.has(docBlockTag.tag) || docBlockTag.type === null) continue
        const fixedValue = removeTagType(comment.value, docBlockTag)
        context.report({
          loc: buildLineLocation(docBlockTag.line),
          messageId: 'typedTag',
          data: { tag: docBlockTag.tag },
          fix: ruleFixer => buildTypelessFix(ruleFixer, comment, fixedValue),
        })
      }
    }
    const listener: TSESLint.RuleListener = {
      Program: () => {
        for (const comment of sourceCode.getAllComments().filter(isDocComment)) judge(comment)
      },
    }

    return listener
  },
}

/**
 * The fix that writes the comment without the type, and nothing when the type could not be found on its line, which is
 * a brace that never closes.
 *
 * @param ruleFixer - What writes the fix.
 * @param comment - The comment.
 * @param fixedValue - The comment, as it reads without the type.
 * @returns The fix, and null when there is nothing to take out.
 */
const buildTypelessFix = (
  ruleFixer: TSESLint.RuleFixer,
  comment: TSESTree.Comment,
  fixedValue: string,
): TSESLint.RuleFix | null => {
  if (fixedValue === comment.value) return null

  return ruleFixer.replaceText(comment, `/*${fixedValue}*/`)
}

/**
 * The comment with the type of one tag taken out, and the space that followed it.
 *
 * @param value - The comment, as the parser read it.
 * @param docBlockTag - The tag whose type goes.
 * @returns The comment, without that type.
 */
const removeTagType = (value: string, docBlockTag: DocBlockTag): string =>
  value
    .split('\n')
    .map((line, index) => removeTypeOnLine(line, index, docBlockTag))
    .join('\n')

/**
 * Removes the type from the line the tag opens on, and leaves every other line as it is.
 *
 * @param line - One line of the comment.
 * @param index - Where the line sits in the comment.
 * @param docBlockTag - The tag whose type goes.
 * @returns The line, without the type when it is the line of the tag.
 */
const removeTypeOnLine = (line: string, index: number, docBlockTag: DocBlockTag): string => {
  if (index !== docBlockTag.lineIndex) return line

  return line.replace(`{${docBlockTag.type}}`, '').replace(`@${docBlockTag.tag}  `, `@${docBlockTag.tag} `)
}
