import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA, TYPED_TAGS } from '../constants/index.js'
import type { DocBlockTag, TsdocRule, TypelessTagMessageId } from '../types/index.js'
import { isDocComment, lineLocationOf, parseDocBlock } from '../utils/index.js'

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
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/typeless-tag.md',
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
        const fixedValue = withoutType(comment.value, docBlockTag)
        context.report({
          loc: lineLocationOf(docBlockTag.line),
          messageId: 'typedTag',
          data: { tag: docBlockTag.tag },
          fix: ruleFixer => fixOrNothing(ruleFixer, comment, fixedValue),
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
const fixOrNothing = (
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
const withoutType = (value: string, docBlockTag: DocBlockTag): string => {
  const lines = value.split('\n')
  /* v8 ignore next -- the tag was read from this line */
  const line = lines[docBlockTag.lineIndex] ?? ''
  lines[docBlockTag.lineIndex] = line
    .replace(`{${docBlockTag.type}}`, '')
    .replace(`@${docBlockTag.tag}  `, `@${docBlockTag.tag} `)

  return lines.join('\n')
}
