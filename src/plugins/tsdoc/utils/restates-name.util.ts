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
 * @param commentValue - The comment as the parser read it.
 * @param name - The name it documents.
 * @returns Whether the summary only rewrites the name.
 */
export const restatesName = (commentValue: string, name: string): boolean => {
  const said = wordsOf(summaryOf(commentValue)).filter(word => !FILLER.has(word))
  const nameWords = new Set(wordsOf(name))

  return said.length > 0 && said.every(word => nameWords.has(word) || nameWords.has(stem(word)))
}

/**
 * The lowercase words of a camel-case name or a sentence.
 *
 * @param text - The name or the sentence.
 * @returns The words.
 */
const wordsOf = (text: string): string[] =>
  /* v8 ignore start -- a name is made of words, so the pattern always matches one */
  /* v8 ignore next -- a name is made of words, so the pattern always matches one */
  (text.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z0-9]+/g) ?? []).map(word => word.toLowerCase())
/* v8 ignore stop */

/**
 * The first sentence of a comment, without the asterisks.
 *
 * @param value - The comment as the parser read it.
 * @returns The summary.
 */
const summaryOf = (value: string): string => {
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
 * `find` for `finds`, `create` for `creates`, `delete` for `deletes`, `retrieve` for `retrieves`.
 *
 * @param word - The word as the summary spells it.
 * @returns The word without its verb ending.
 */
const stem = (word: string): string => word.replace(/(es|s)$/, '')
