import { splitIntoWords } from '../../shared/utils/index.js'

/** Words a summary may spend without saying anything the name did not. */
const FILLER = new Set([
  'a',
  'an',
  'the',
  'of',
  'to',
  'for',
  'and',
  'or',
  'by',
  'with',
  'in',
  'on',
  'from',
  'one',
  'all',
])

/**
 * Whether the summary of a comment only rewrites the name it documents: every word of its first sentence, once the
 * filler is dropped, is a word of the name.
 *
 * The filler and the verb endings are English, like the names of the code. A summary in another language shares no
 * word with an English name, so it never reads as a restatement.
 *
 * @param commentValue - The comment as the parser read it.
 * @param name - The name it documents.
 * @returns Whether the summary only rewrites the name.
 */
export const restatesName = (commentValue: string, name: string): boolean => {
  const said = splitIntoWords(readSummary(commentValue)).filter(word => !FILLER.has(word))
  const nameWords = new Set(splitIntoWords(name))

  return said.length > 0 && said.every(word => nameWords.has(word) || nameWords.has(stripVerbEnding(word)))
}

/**
 * The first sentence of a comment, without the asterisks.
 *
 * @param value - The comment as the parser read it.
 * @returns The summary.
 */
const readSummary = (value: string): string => {
  const text = value
    .split('\n')
    .map(line => line.replace(/^\s*\*+\s?/, ''))
    .join(' ')
    .trim()
  const end = text.search(/[.!?](\s|$)/)
  if (end < 0) return text

  return text.slice(0, end)
}

/**
 * Strips the ending a verb takes in the third person: `find` for `finds`, `create` for `creates`, `delete` for
 * `deletes`, `retrieve` for `retrieves`.
 *
 * @param word - The word as the summary spells it.
 * @returns The word without its verb ending.
 */
const stripVerbEnding = (word: string): string => word.replace(/(es|s)$/, '')
