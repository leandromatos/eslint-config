import type { TSESTree } from '@typescript-eslint/utils'

import { TSDOC_TAG } from '../constants/index.js'
import type { DocBlock, DocBlockTag, NamedTagContent, TypedTagContent } from '../types/index.js'

/** A line that opens a block tag: an at sign at the start of the text, and the name up to the next space. */
const TAG_LINE_REG_EXP = /^\s*@(\S+)(.*)$/

/** A description that opens with the hyphen TSDoc writes between a name and its text. */
const HYPHEN_REG_EXP = /^-\s+(?=\S)/

/**
 * Reads a documentation comment into its main description and its block tags.
 *
 * A tag opens a line, so an at sign inside a sentence is text, and so is every line between two code fences. A tag
 * runs through the lines that follow it until the next tag. The hyphen before the text of a `@param` and of a
 * `@returns` is dropped when text follows it, so a bare hyphen still reads as written.
 *
 * @param comment - The block comment, whose value opens with the second asterisk.
 * @returns The comment, as its description and its tags.
 */
export const parseDocBlock = (comment: TSESTree.Comment): DocBlock => {
  const lines = comment.value.split('\n').map((rawLine, index) => stripLine(rawLine, index))
  const startLine = comment.loc.start.line
  const tagStarts: number[] = []
  let isInFence = false
  for (const [index, line] of lines.entries()) {
    if (line.trim().startsWith('```')) isInFence = !isInFence
    if (!isInFence && TAG_LINE_REG_EXP.test(line)) tagStarts.push(index)
  }
  const firstTagIndex = tagStarts[0] ?? lines.length
  const descriptionLines = lines.slice(0, firstTagIndex)
  const descriptionOffset = descriptionLines.findIndex(line => line.trim() !== '')
  const tags = tagStarts.map((tagStart, position) =>
    readTag(lines.slice(tagStart, tagStarts[position + 1] ?? lines.length), startLine + tagStart, tagStart),
  )

  const description = descriptionLines.join('\n').trim()
  const descriptionLine = startLine + Math.max(descriptionOffset, 0)

  return { description, descriptionLine, tags }
}

/**
 * Drops what frames a line of the comment: the second asterisk on the first line, the leading asterisk on the rest,
 * and the one space after either.
 *
 * @param rawLine - The line as the comment holds it.
 * @param index - The position of the line in the comment.
 * @returns The text of the line.
 */
const stripLine = (rawLine: string, index: number): string => {
  if (index === 0) return rawLine.replace(/^\*/, '').replace(/^ /, '')

  return rawLine.replace(/^\s*\*?/, '').replace(/^ /, '')
}

/**
 * Reads one block tag from the lines it runs through.
 *
 * @param tagLines - The line that opens the tag, then the lines before the next one.
 * @param line - The line of the file the tag opens on.
 * @param lineIndex - The position of that line in the comment.
 * @returns The tag.
 */
const readTag = (tagLines: string[], line: number, lineIndex: number): DocBlockTag => {
  const [opening, ...following] = tagLines
  const tag = String(opening).replace(TAG_LINE_REG_EXP, '$1')
  const rest = String(opening).replace(TAG_LINE_REG_EXP, '$2')
  const content = [rest, ...following].join('\n').trimStart()
  const { type, rest: afterType } = readType(content)
  if (tag !== TSDOC_TAG.param) {
    const parameterName = ''
    const description = readDescription(afterType, tag === TSDOC_TAG.returns)

    return { tag, line, lineIndex, type, parameterName, description }
  }
  const { name: parameterName, rest: afterName } = readParameterName(afterType)
  const description = readDescription(afterName, true)

  return { tag, line, lineIndex, type, parameterName, description }
}

/**
 * Splits off the type a tag carries in braces right after its name, counting nested braces.
 *
 * @param content - What follows the tag name.
 * @returns The type, null when the content opens with no brace, and what follows it.
 */
const readType = (content: string): TypedTagContent => {
  if (!content.startsWith('{')) return readUntypedContent(content)
  let depth = 0
  for (const [index, character] of [...content].entries()) {
    if (character === '{') depth += 1
    if (character === '}') depth -= 1
    if (depth === 0) {
      const type = content.slice(1, index)
      const rest = content.slice(index + 1).trimStart()

      return { type, rest }
    }
  }
  const type = content.slice(1)
  const rest = ''

  return { type, rest }
}

/**
 * Reads the content of a tag that opens with no brace: no type, and the whole content after the name.
 *
 * @param content - What follows the tag name.
 * @returns The content, with no type.
 */
const readUntypedContent = (content: string): TypedTagContent => {
  const type = null
  const rest = content

  return { type, rest }
}

/**
 * The text of a tag, without the hyphen TSDoc writes before the text of a `@param` and of a `@returns`.
 *
 * @param content - What follows the name, or the tag when it names nothing.
 * @param isHyphenated - Whether the tag writes a hyphen before its text.
 * @returns The description, trimmed.
 */
const readDescription = (content: string, isHyphenated: boolean): string => {
  if (!isHyphenated) return content.trim()

  return content.replace(HYPHEN_REG_EXP, '').trim()
}

/**
 * Splits off the name a `@param` documents. A name in brackets is an optional one, and its default goes with them.
 *
 * @param content - What follows the tag, after any type.
 * @returns The name, and what follows it.
 */
const readParameterName = (content: string): NamedTagContent => {
  if (content.startsWith('[')) return readBracketedName(content)
  const name = content.replace(/\s[\s\S]*$/, '')
  const rest = content.slice(name.length).trimStart()

  return { name, rest }
}

/**
 * Reads the name of an optional parameter, written in brackets with its default after an equals sign.
 *
 * @param content - What follows the tag, opening with the bracket.
 * @returns The name, and what follows the closing bracket.
 */
const readBracketedName = (content: string): NamedTagContent => {
  const closing = content.indexOf(']')
  if (closing < 0) {
    const name = stripParameterDefault(content.slice(1))
    const rest = ''

    return { name, rest }
  }
  const name = stripParameterDefault(content.slice(1, closing))
  const rest = content.slice(closing + 1).trimStart()

  return { name, rest }
}

/**
 * The name of an optional parameter, without the default written after it.
 *
 * @param inner - The text between the brackets.
 * @returns The name, trimmed.
 */
const stripParameterDefault = (inner: string): string => inner.replace(/=[\s\S]*$/, '').trim()
