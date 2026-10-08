import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_TOKEN_TYPES } from '@typescript-eslint/utils'

import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { CommentFormMessageId, CommentParagraph, TsdocRule } from '../types/index.js'

/**
 * A comment the tooling reads rather than a person: it is a line by contract.
 *
 * A third slash opens one too. Rewrapping `/// <reference />` into a block takes the reference out of the program,
 * and the compiler says nothing about the types it stops seeing.
 */
const DIRECTIVE_REG_EXP = /^\s*(\/|eslint|@ts-|prettier-|v8 ignore|c8 ignore|istanbul|region|#)/

/** What opens a tag paragraph, which never folds into the sentence above it. */
const TAG_REG_EXP = /^@\w+/

/** What opens or closes a fenced code block inside a comment, where a line that opens with `@` is code. */
const FENCE_REG_EXP = /^```/

/** The characters a line of a block comment spends before its text: the indentation, then `* `. */
const BLOCK_PREFIX_WIDTH = 3

/**
 * An implementation note is a line while it fits on one, and a block once it runs to a paragraph.
 * A paragraph written as a stack of `//` lines reads as several notes and moves as one, and the
 * next person to add a sentence has to repeat the marker to keep it together. Either form is
 * wrapped at the column the formatter wraps code at, which the formatter itself will not do to a
 * comment.
 *
 * In a documentation comment, a blank line separates the summary from the first tag, so the text a
 * reader looks for and the tags a tool reads open paragraphs of their own.
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
      tagAgainstSummary: 'The first tag follows the summary with no blank line between them. Leave one.',
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
        for (const comment of blockCommentsOf(sourceCode)) {
          const line = lineOfFirstTag(comment)
          if (line === null) continue
          context.report({
            node: comment,
            messageId: 'tagAgainstSummary',
            fix: ruleFixer => ruleFixer.replaceText(comment, withBlankBefore(comment, line)),
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
 * The line of a documentation comment that holds its first tag, when the summary runs into it.
 *
 * A line inside a fenced code block is code, so a decorator there opens no tag.
 *
 * @param comment - The comment the rule reads.
 * @returns The index of the line, and null where a blank line already separates the two or the comment holds no
 * summary above a tag.
 */
const lineOfFirstTag = (comment: TSESTree.Comment): number | null => {
  if (!comment.value.startsWith('*')) return null
  const texts = comment.value.split('\n').map(stripMarker)
  let isInFence = false
  for (const [index, text] of texts.entries()) {
    if (FENCE_REG_EXP.test(text)) isInFence = !isInFence
    if (isInFence || !TAG_REG_EXP.test(text)) continue
    if (index === 0 || texts[index - 1] === '') return null

    return index
  }

  return null
}

/**
 * The same comment with a blank line above the line of its first tag.
 *
 * @param comment - The comment being rewritten.
 * @param line - The index of the line that holds the first tag.
 * @returns The comment.
 */
const withBlankBefore = (comment: TSESTree.Comment, line: number): string => {
  const lines = comment.value.split('\n')
  const indent = ' '.repeat(comment.loc.start.column)
  lines.splice(line, 0, `${indent} *`)

  return `/*${lines.join('\n')}*/`
}

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
  const paragraphs = paragraphsOf(comment)
  const firstTag = paragraphs.findIndex(paragraph => TAG_REG_EXP.test(paragraph.text))
  const lines = paragraphs.flatMap((paragraph, index) => wrappedParagraph(paragraph, index, width, index === firstTag))

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
 * The paragraphs of a block comment: what a blank line separates, every tag on its own, and every fenced block.
 *
 * A wrapped line is joined back to the one above it, because a break inside a sentence is where
 * the previous column fell rather than something the author meant. A fenced block is code, so its
 * lines are kept as written, indentation included.
 *
 * @param comment - The comment being rewritten.
 * @returns The paragraphs, in order.
 */
const paragraphsOf = (comment: TSESTree.Comment): CommentParagraph[] => {
  const paragraphs: CommentParagraph[] = []
  let fence: CommentParagraph | null = null
  let isAfterBlank = false
  for (const rawLine of comment.value.replace(/^\*/, '').split('\n')) {
    const line = stripMarker(rawLine)
    const last = paragraphs.at(-1)
    if (fence) {
      fence.verbatim.push(verbatimOf(rawLine))
      if (FENCE_REG_EXP.test(line)) fence = null
      continue
    }
    if (FENCE_REG_EXP.test(line)) {
      fence = { text: '', verbatim: [verbatimOf(rawLine)], isAfterBlank }
      paragraphs.push(fence)
      isAfterBlank = false
      continue
    }
    if (!line) {
      isAfterBlank = paragraphs.length > 0
      continue
    }
    if (!last || isAfterBlank || last.verbatim.length || TAG_REG_EXP.test(line))
      paragraphs.push({ text: line, verbatim: [], isAfterBlank })
    else last.text = `${last.text} ${line}`
    isAfterBlank = false
  }

  return paragraphs
}

/**
 * One paragraph as lines, with the blank line that opens it.
 *
 * The first paragraph opens the comment, so it carries none. The first tag keeps the blank line that separates it
 * from the summary, a tag below another tag carries none, and any other paragraph keeps the one it was written with.
 *
 * @param paragraph - The paragraph.
 * @param index - Where it sits in the comment.
 * @param width - The column the text is wrapped at.
 * @param isFirstTag - Whether it is the first tag of the comment.
 * @returns The lines.
 */
const wrappedParagraph = (paragraph: CommentParagraph, index: number, width: number, isFirstTag: boolean): string[] => {
  const lines = linesOf(paragraph, width)
  if (!index) return lines
  if (isFirstTag) return ['', ...lines]
  if (TAG_REG_EXP.test(paragraph.text) || !paragraph.isAfterBlank) return lines

  return ['', ...lines]
}

/**
 * The lines of a paragraph: a fenced block as written, and text wrapped at the column.
 *
 * @param paragraph - The paragraph.
 * @param width - The column the text is wrapped at.
 * @returns The lines.
 */
const linesOf = (paragraph: CommentParagraph, width: number): string[] => {
  if (paragraph.verbatim.length) return paragraph.verbatim

  return wrap(paragraph.text, width)
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
 * A line of a fenced block without its `*` marker, its indentation kept.
 *
 * @param line - The line as it stands.
 * @returns The code it carries.
 */
const verbatimOf = (line: string): string => line.replace(/^\s*\* ?/, '').trimEnd()

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
 * A code span is one word: TSDoc closes a span on the line it opens, so a span broken across two lines is a span that
 * never closes. So is an inline tag. A word longer than the width stays whole and runs past it.
 *
 * @param text - The paragraph's text.
 * @param width - The column the text is wrapped at.
 * @returns The lines.
 */
const wrap = (text: string, width: number): string[] => {
  const lines: string[] = []
  let line = ''
  for (const word of wordsOf(text)) {
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
 * The words of a paragraph, with every code span and every inline tag held together as one, its spaces kept: a
 * link broken across two lines is one TSDoc reads as two words.
 *
 * @param text - The paragraph's text.
 * @returns The words, in order.
 */
const wordsOf = (text: string): string[] => {
  const words: string[] = []
  let span = ''
  for (const token of text.split(/\s+/).filter(Boolean)) {
    span = joined(span, token)
    if (countOf(span, '`') % 2 === 0 && countOf(span, '{') <= countOf(span, '}')) {
      words.push(span)
      span = ''
    }
  }
  if (span) words.push(span)

  return words
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

/**
 * How many times a piece of text holds a character, which says whether a code span or an inline tag it opened is
 * closed.
 *
 * @param text - The text.
 * @param character - The character, a backtick or a brace.
 * @returns The count.
 */
const countOf = (text: string, character: string): number => [...text].filter(each => each === character).length
