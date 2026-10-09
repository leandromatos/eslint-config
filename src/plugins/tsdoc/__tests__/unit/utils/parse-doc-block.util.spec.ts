import type { DocBlock, DocComment, DocNode } from '@microsoft/tsdoc'
import { DocCodeSpan, DocExcerpt, TSDocParser } from '@microsoft/tsdoc'
import { parse } from '@typescript-eslint/typescript-estree'
import type { TSESTree } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { parseDocBlock } from '../../../utils/parse-doc-block.util.js'

/*
 * Comments TSDoc accepts as written. On each of them this parser reads what `@microsoft/tsdoc` reads, which is the
 * parser `tsdoc/syntax` runs, so the rules of this plugin and the grammar check never disagree on what a comment says.
 */
const WELL_FORMED_COMMENTS = [
  '/** Reads one user. */',
  '/**\n * Reads one user.\n *\n * Answers from the cache when the user was read before.\n */',
  '/**\n * Reads one user.\n *\n * @param id - The ID of the user.\n * @returns The user.\n */',
  '/**\n * Reads one user.\n *\n * @param id - The ID of the user,\n *   written across two lines.\n * @param name - The name.\n */',
  '/**\n * Reads one user, by `id`.\n *\n * @returns The user, or `null` when none matches.\n * @throws NotFoundException When the user does not exist.\n */',
  '/**\n * Reads one user.\n *\n * @example\n * ```ts\n * read(1)\n * ```\n */',
  '/**\n * Reads one user.\n *\n * @remarks\n * The cache answers first.\n *\n * @see The users controller.\n */',
  '/**\n * Reads one user, as {@link UsersService.findOneUser} does.\n *\n * @deprecated Read through the service instead.\n */',
]

const tsdocParser = new TSDocParser()

describe('parseDocBlock', () => {
  it.each(WELL_FORMED_COMMENTS)('reads %j as TSDoc reads it', code => {
    const { docComment, log } = tsdocParser.parseString(code)

    const docBlock = parseDocBlock(readFirstComment(code))

    expect(log.messages.map(message => message.text)).toEqual([])
    expect(normalizeSpace(docBlock.description)).toBe(readDocText(docComment.summarySection))
    expect(docBlock.tags.map(tag => writeTag(tag.tag, tag.parameterName, tag.description)).sort()).toEqual(
      listTsdocTags(docComment).sort(),
    )
  })
})

/**
 * Parses the first comment of a snippet, the way the rules receive it from ESLint.
 *
 * @param code - The snippet, which opens with the comment.
 * @returns The comment.
 * @throws Error When the snippet holds no comment.
 */
const readFirstComment = (code: string): TSESTree.Comment => {
  const [comment] = parse(`${code}\nfunction read() {}`, { comment: true, loc: true, range: true }).comments
  if (!comment) throw new Error('the snippet holds no comment')

  return comment
}

/**
 * Lists the block tags `@microsoft/tsdoc` reads in a comment, each written as {@link writeTag} writes it.
 *
 * @param docComment - The comment, as `@microsoft/tsdoc` read it.
 * @returns The tags.
 */
const listTsdocTags = (docComment: DocComment): string[] => {
  const parameterTags = docComment.params.blocks.map(paramBlock =>
    writeTag('param', paramBlock.parameterName, readDocText(paramBlock.content)),
  )
  const blocks = [
    docComment.remarksBlock,
    docComment.deprecatedBlock,
    docComment.returnsBlock,
    ...docComment.customBlocks,
    ...docComment.seeBlocks,
  ].filter((block): block is DocBlock => block !== undefined)
  const otherTags = blocks.map(block => writeTag(block.blockTag.tagName.slice(1), '', readDocText(block.content)))

  return [...parameterTags, ...otherTags]
}

/**
 * Writes a tag as one line both parsers can be compared by.
 *
 * @param tag - The name of the tag, without the at sign.
 * @param parameterName - The name a `@param` documents, and an empty string for any other tag.
 * @param description - The text of the tag.
 * @returns The line.
 */
const writeTag = (tag: string, parameterName: string, description: string): string =>
  `@${tag} ${parameterName} ${normalizeSpace(description)}`

/**
 * Reads the text of a node of `@microsoft/tsdoc` as it was written, with every run of white space as one space.
 *
 * @param docNode - The node.
 * @returns The text.
 */
const readDocText = (docNode: DocNode): string => normalizeSpace(collectDocText(docNode))

/**
 * Collapses every run of white space to one space, which is how both parsers' text reads once rendered.
 *
 * @param text - The text.
 * @returns The text, on one line and trimmed.
 */
const normalizeSpace = (text: string): string => text.replace(/\s+/g, ' ').trim()

/**
 * Collects the text a node of `@microsoft/tsdoc` was written with, a code span between its backticks.
 *
 * @param docNode - The node.
 * @returns The text.
 */
const collectDocText = (docNode: DocNode): string => {
  if (docNode instanceof DocCodeSpan) return `\`${docNode.code}\``
  if (docNode instanceof DocExcerpt) return docNode.content.toString()

  return docNode
    .getChildNodes()
    .map(childNode => collectDocText(childNode))
    .join('')
}
