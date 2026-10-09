import { describe, expect, it } from 'vitest'

import { buildValueSuffixEntries } from '../../../utils/build-value-suffix-entries.util.js'

/** What an entry without a pattern reads as, so an assertion on it fails rather than throws. */
const MATCHES_NOTHING = /(?!)/u

/**
 * Reads the pattern an entry forbids, from the options of `naming-convention` it carries.
 *
 * @param entries - The entries.
 * @param name - The name of the entry.
 * @returns The pattern, as a regular expression.
 */
const readForbiddenPattern = (entries: ReturnType<typeof buildValueSuffixEntries>, name: string): RegExp => {
  const entry = entries.find(configEntry => configEntry.name === name)
  const ruleEntry = entry?.rules?.['@typescript-eslint/naming-convention']
  if (!Array.isArray(ruleEntry)) return MATCHES_NOTHING
  const value: unknown = ruleEntry[1]
  if (typeof value !== 'object' || value === null || !('custom' in value)) return MATCHES_NOTHING
  const { custom } = value
  if (typeof custom !== 'object' || custom === null || !('regex' in custom)) return MATCHES_NOTHING

  return new RegExp(String(custom.regex), 'u')
}

describe('buildValueSuffixEntries', () => {
  const entries = buildValueSuffixEntries(['src/**/*.ts'], ['doc', 'example'])

  it('builds no entry for a tier that names no kind', () => {
    expect(buildValueSuffixEntries(['src/**/*.ts'], [])).toEqual([])
  })

  it('keeps the word of a kind out of every other file, and leaves a function free to carry it', () => {
    const elsewhere = entries.find(entry => entry.name === 'leandromatos/value-suffixes')

    expect(elsewhere?.files).toEqual(['src/**/*.ts'])
    expect(elsewhere?.ignores).toEqual(['**/*.doc.ts', '**/*.example.ts'])
    expect(elsewhere?.rules?.['@typescript-eslint/naming-convention']).toContainEqual({
      selector: 'variable',
      modifiers: ['exported'],
      format: null,
      types: ['function'],
    })
  })

  it('reads the word as a word of the name, first or last, in any casing and in the plural', () => {
    const pattern = readForbiddenPattern(entries, 'leandromatos/value-suffixes')

    for (const name of [
      'EXAMPLE_IDS',
      'REGISTRATION_RESPONSE_EXAMPLE',
      'userNotFoundExample',
      'exampleUser',
      'DOCS_PATH',
    ])
      expect(pattern.test(name)).toBe(true)
    for (const name of ['counterexampled', 'documentTitle', 'DOCUMENT_TYPE', 'Docker'])
      expect(pattern.test(name)).toBe(false)
  })

  it('closes a value of a kind with its word, and keeps the words of the other kinds out', () => {
    const exampleEntry = entries.find(entry => entry.name === 'leandromatos/example-values')

    expect(exampleEntry?.files).toEqual(['**/*.example.ts'])
    expect(exampleEntry?.rules?.['@typescript-eslint/naming-convention']).toEqual([
      'error',
      expect.objectContaining({ suffix: ['Example', 'Examples'] }),
    ])
    expect(readForbiddenPattern(entries, 'leandromatos/example-values').test('createUserDoc')).toBe(true)
  })

  it('forbids no other word to a kind that is the only one', () => {
    const [, onlyEntry] = buildValueSuffixEntries(['src/**/*.ts'], ['example'])

    expect(onlyEntry?.rules?.['@typescript-eslint/naming-convention']).toEqual([
      'error',
      { selector: 'variable', modifiers: ['exported'], format: null, suffix: ['Example', 'Examples'] },
    ])
  })
})
