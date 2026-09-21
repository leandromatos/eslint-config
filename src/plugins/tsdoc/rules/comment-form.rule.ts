import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_TOKEN_TYPES } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { CommentFormMessageId, TsdocRule } from '../types/index.js'

/**
 * A comment the tooling reads rather than a person: it is a line by contract.
 *
 * A third slash opens one too. Rewrapping `/// <reference />` into a block takes the reference out of the program,
 * and the compiler says nothing about the types it stops seeing.
 */
const DIRECTIVE_REG_EXP = /^\s*(\/|eslint|@ts-|prettier-|v8 ignore|c8 ignore|istanbul|region|#)/

/** What opens a tag paragraph, which never folds into the sentence above it. */
const TAG_REG_EXP = /^@\w+/

/** The characters a line of a block comment spends before its text: the indentation, then `* `. */
const BLOCK_PREFIX_WIDTH = 3

/**
 * An implementation note is a line while it fits on one, and a block once it runs to a paragraph.
 * A paragraph written as a stack of `//` lines reads as several notes and moves as one, and the
 * next person to add a sentence has to repeat the marker to keep it together. Either form is
 * wrapped at the column the formatter wraps code at, which the formatter itself will not do to a
 * comment.
 */
export const commentForm: TsdocRule<CommentFormMessageId> = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'A note that runs to a paragraph is a block comment, wrapped at the configured column.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/comment-form.md',
      dialects: ['TypeScript'],
    },
    fixable: 'whitespace',
    messages: {
      lineRun: 'This note takes {{count}} lines. A note that runs to a paragraph is written as a block comment.',
      pastWidth: 'This comment runs past column {{width}}. Wrap it there, where the formatter wraps code.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const [{ commentWidth }] = context.options
    const { sourceCode } = context
    const listener: TSESLint.RuleListener = {
      Program: () => {
        for (const run of runsOf(sourceCode)) {
          const [first] = run
          /* v8 ignore next -- a run is built from at least one comment */
          if (!first) continue
          const rewritten = blockOf(run, commentWidth)
          if (run.length > 1)
            context.report({
              node: first,
              messageId: 'lineRun',
              data: { count: String(run.length) },
              fix: ruleFixer => ruleFixer.replaceTextRange(rangeOf(run), rewritten),
            })
          else if (isPastWidth(run, commentWidth))
            context.report({
              node: first,
              messageId: 'pastWidth',
              data: { width: String(commentWidth) },
              fix: ruleFixer => ruleFixer.replaceTextRange(rangeOf(run), rewritten),
            })
        }
        for (const comment of blockCommentsOf(sourceCode)) {
          if (!isPastWidth([comment], commentWidth)) continue
          context.report({
            node: comment,
            messageId: 'pastWidth',
            data: { width: String(commentWidth) },
            fix: ruleFixer => ruleFixer.replaceText(comment, rewrapped(comment, commentWidth)),
          })
        }
      },
    }

    return listener
  },
}

/**
 * The runs of line comments that stand on lines of their own, one after another, directives out.
 *
 * @param sourceCode - The source the comments are written in.
 * @returns The runs, each in the order its lines are written.
 */
const runsOf = (sourceCode: TSESLint.SourceCode): TSESTree.Comment[][] => {
  const runs: TSESTree.Comment[][] = []
  let run: TSESTree.Comment[] = []
  const close = (): void => {
    if (run.length) runs.push(run)
    run = []
  }
  for (const comment of sourceCode.getAllComments()) {
    const isNote =
      comment.type === AST_TOKEN_TYPES.Line &&
      !DIRECTIVE_REG_EXP.test(comment.value) &&
      isFirstOnLine(comment, sourceCode)
    if (!isNote) {
      close()
      continue
    }
    if (run.at(-1)?.loc.end.line !== comment.loc.start.line - 1) close()
    run.push(comment)
  }
  close()

  return runs
}

/**
 * The block comments a person wrote, documentation and directives left out.
 *
 * @param sourceCode - The source the comments are written in.
 * @returns The comments.
 */
const blockCommentsOf = (sourceCode: TSESLint.SourceCode): TSESTree.Comment[] =>
  sourceCode
    .getAllComments()
    .filter(comment => comment.type === AST_TOKEN_TYPES.Block && !DIRECTIVE_REG_EXP.test(comment.value))

/**
 * Whether nothing but whitespace precedes the comment on its line.
 *
 * @param comment - The comment the rule reads.
 * @param sourceCode - The source it is written in.
 * @returns Whether it opens its line.
 */
const isFirstOnLine = (comment: TSESTree.Comment, sourceCode: TSESLint.SourceCode): boolean =>
  /* v8 ignore start -- the comment sits on a line the source code holds */
  /* v8 ignore next -- the comment sits on a line the source code holds */
  (sourceCode.lines[comment.loc.start.line - 1] ?? '').slice(0, comment.loc.start.column).trim() === ''

/* v8 ignore stop */
/**
 * Whether any line of the comment ends past the column.
 *
 * @param comments - The comments of one run.
 * @param commentWidth - The column a comment is wrapped at.
 * @returns Whether one of them runs past it.
 */
const isPastWidth = (comments: TSESTree.Comment[], commentWidth: number): boolean =>
  comments.some(comment => comment.loc.end.column > commentWidth || columnOfLongestLine(comment) > commentWidth)

/**
 * The end column of the longest line a comment spans.
 *
 * @param comment - The comment the rule reads.
 * @returns The column it ends at.
 */
const columnOfLongestLine = (comment: TSESTree.Comment): number => {
  const [firstLine, ...rest] = comment.value.split('\n')
  /* v8 ignore next -- a comment always carries a first line */
  const firstWidth = comment.loc.start.column + (firstLine?.length ?? 0) + 2

  return Math.max(firstWidth, ...rest.map(line => line.length))
}

/**
 * The range the run occupies, from the first marker to the last character.
 *
 * @param run - The comments of one run.
 * @returns The range the fix replaces.
 */
const rangeOf = (run: TSESTree.Comment[]): [number, number] => [
  /* v8 ignore start -- a run is built from at least one comment */
  /* v8 ignore next -- a run is built from at least one comment */
  run[0]?.range[0] ?? 0,
  /* v8 ignore next -- a run is built from at least one comment */
  /* v8 ignore next -- a run is built from at least one comment */
  run[run.length - 1]?.range[1] ?? 0,
]
/* v8 ignore stop */

/**
 * The same paragraph as a block comment, wrapped at the column.
 *
 * @param run - The comments of one run.
 * @param commentWidth - The column a comment is wrapped at.
 * @returns The block comment.
 */
const blockOf = (run: TSESTree.Comment[], commentWidth: number): string => {
  /* v8 ignore next -- a run is built from at least one comment */
  const indent = ' '.repeat(run[0]?.loc.start.column ?? 0)
  const text = textOf(run)
  const lines = wrap(text, commentWidth - indent.length - BLOCK_PREFIX_WIDTH)

  return ['/*', ...lines.map(line => `${indent} * ${line}`), `${indent} */`].join('\n')
}

/**
 * The same block comment, wrapped at the column.
 *
 * A blank line and a tag both open a paragraph of their own: a `@param` folded into the sentence
 * above it stops being a tag, and the two lose the one thing their form carries.
 *
 * @param comment - The comment being rewritten.
 * @param commentWidth - The column a comment is wrapped at.
 * @returns The comment, rewrapped.
 */
const rewrapped = (comment: TSESTree.Comment, commentWidth: number): string => {
  const indent = ' '.repeat(comment.loc.start.column)
  const opening = openingOf(comment)
  const width = commentWidth - indent.length - BLOCK_PREFIX_WIDTH
  const lines = paragraphsOf(comment).flatMap((paragraph, index) => wrappedParagraph(paragraph, index, width))

  return [opening, ...lines.map(line => `${indent} *${spaced(line)}`), `${indent} */`].join('\n')
}

/**
 * What the comment opens with: a documentation comment keeps its second asterisk, a note does not.
 *
 * @param comment - The comment being rewritten.
 * @returns The opening marker.
 */
const openingOf = (comment: TSESTree.Comment): string => {
  if (comment.value.startsWith('*')) return '/**'

  return '/*'
}

/**
 * The paragraphs of a block comment: what a blank line separates, and every tag on its own.
 *
 * A wrapped line is joined back to the one above it, because a break inside a sentence is where
 * the previous column fell rather than something the author meant.
 *
 * @param comment - The comment being rewritten.
 * @returns The paragraphs, in order.
 */
const paragraphsOf = (comment: TSESTree.Comment): string[] => {
  const paragraphs: string[] = []
  for (const line of comment.value.replace(/^\*/, '').split('\n').map(stripMarker)) {
    const opensParagraph = !line || TAG_REG_EXP.test(line) || !paragraphs.length || !paragraphs.at(-1)
    if (opensParagraph) paragraphs.push(line)
    /* v8 ignore next -- the line joins a paragraph, which is what the branch above opened */
    /* v8 ignore start -- the line joins the paragraph the branch above opened */
    else paragraphs[paragraphs.length - 1] = `${paragraphs.at(-1) ?? ''} ${line}`.trim()
    /* v8 ignore stop */
  }

  return paragraphs.filter((paragraph, index) => paragraph || (index > 0 && index < paragraphs.length - 1))
}

/**
 * One paragraph as lines, with the blank line that opens it.
 *
 * The first paragraph opens the comment, and a tag opens a paragraph of its own without a blank line above it, so
 * neither carries one.
 *
 * @param paragraph - The paragraph's text.
 * @param index - Where it sits in the comment.
 * @param width - The column the text is wrapped at.
 * @returns The lines.
 */
const wrappedParagraph = (paragraph: string, index: number, width: number): string[] => {
  /* A blank paragraph is the separator itself, and the paragraph below it opens with one; emitting both doubles it. */
  if (!paragraph) return []
  const wrapped = wrap(paragraph, width)
  if (!index || TAG_REG_EXP.test(paragraph)) return wrapped

  return ['', ...wrapped]
}

/**
 * The text after the marker, and nothing on a line the comment leaves blank.
 *
 * @param line - The line as it stands.
 * @returns The line with its leading space, when it carries text.
 */
const spaced = (line: string): string => {
  if (!line) return ''

  return ` ${line}`
}

/**
 * A line of a block comment without its `*` marker.
 *
 * @param line - The line as it stands.
 * @returns The text it carries.
 */
const stripMarker = (line: string): string => line.replace(/^\s*\*\s?/, '').trim()

/**
 * The text of a run, as one paragraph.
 *
 * @param run - The comments of one run.
 * @returns The text.
 */
const textOf = (run: TSESTree.Comment[]): string => run.map(comment => comment.value.trim()).join(' ')

/**
 * The text as lines no longer than the width, breaking between words.
 *
 * @param text - The paragraph's text.
 * @param width - The column the text is wrapped at.
 * @returns The lines.
 */
const wrap = (text: string, width: number): string[] => {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line)
      line = word
      continue
    }
    line = joined(line, word)
  }
  /* v8 ignore next -- the text is wrapped word by word, so the last line carries one */
  if (line) lines.push(line)

  return lines
}

/**
 * The word added to the line, or the word alone when the line is empty.
 *
 * @param line - The line as it stands.
 * @param word - The word being added.
 * @returns The line.
 */
const joined = (line: string, word: string): string => {
  if (!line) return word

  return `${line} ${word}`
}
