import { NAMESPACE } from '../../plugins/index.js'
import { toUpperFirst } from '../../plugins/shared/utils/index.js'
import type { Config } from '../types/index.js'

/** The rule of typescript-eslint that holds the name of a value to a suffix and a pattern. */
const NAMING_CONVENTION = '@typescript-eslint/naming-convention'

/** What the entries judge: a variable the file exports, in any casing. */
const EXPORTED_VALUE = { selector: 'variable', modifiers: ['exported'], format: null }

/** A function says what it does to a value of the kind, so it may carry the word anywhere: `buildExampleValue`. */
const EXPORTED_FUNCTION = { ...EXPORTED_VALUE, types: ['function'] }

/**
 * Builds the entries that close the name of a value with the kind of its file, through `naming-convention` applied by
 * `files`: every value a `.example.ts` file exports ends in `Example`, or `Examples`, and no value another file exports
 * carries the word of a kind, first or last.
 *
 * @param files - The files the tier judges.
 * @param valueSuffixes - The kinds of file whose values end in the kind's word.
 * @returns The entries, and none for a tier that names no kind.
 */
export const buildValueSuffixEntries = (files: string[], valueSuffixes: string[]): Config[] => {
  if (valueSuffixes.length === 0) return []
  const elsewhereEntry: Config = {
    name: `${NAMESPACE}/value-suffixes`,
    files,
    ignores: valueSuffixes.map(readKindFiles),
    rules: { [NAMING_CONVENTION]: ['error', forbidWords(EXPORTED_VALUE, valueSuffixes), EXPORTED_FUNCTION] },
  }

  return [elsewhereEntry, ...valueSuffixes.map(suffix => buildKindEntry(suffix, valueSuffixes))]
}

/**
 * Builds the entry of one kind: its values end in its word, and carry the word of no other kind.
 *
 * @param suffix - The kind.
 * @param valueSuffixes - Every kind the tier names.
 * @returns The entry.
 */
const buildKindEntry = (suffix: string, valueSuffixes: string[]): Config => {
  const word = toUpperFirst(suffix)
  const kindValue = { ...EXPORTED_VALUE, suffix: [word, `${word}s`] }
  const otherKinds = valueSuffixes.filter(valueSuffix => valueSuffix !== suffix)
  const kindEntry: Config = {
    name: `${NAMESPACE}/${suffix}-values`,
    files: [readKindFiles(suffix)],
    rules: { [NAMING_CONVENTION]: ['error', forbidWords(kindValue, otherKinds)] },
  }

  return kindEntry
}

/**
 * Reads the glob that matches every file of one kind, wherever in the tree it sits.
 *
 * @param suffix - The kind.
 * @returns The glob of its files.
 */
const readKindFiles = (suffix: string): string => `**/*.${suffix}.ts`

/**
 * Forbids a value to carry the word of any of the kinds, and leaves it as it is when there is none to forbid.
 *
 * @param value - The selector of the value.
 * @param kinds - The kinds whose words the value may not carry.
 * @returns The selector.
 */
const forbidWords = <TValue extends object>(value: TValue, kinds: string[]): TValue => {
  if (kinds.length === 0) return value

  return { ...value, custom: { regex: kinds.map(readWordPattern).join('|'), match: false } }
}

/**
 * Reads the pattern of a word inside a name, in any casing and in the plural: `example`, `Example`, `EXAMPLES`, as a
 * word of `exampleUser`, `userNotFoundExample` or `EXAMPLE_IDS`, and not as a part of `counterexampled` or
 * `DOCUMENT_TYPE`.
 *
 * @param word - The word, in lower case.
 * @returns The pattern.
 */
const readWordPattern = (word: string): string => {
  const lowerFirst = `^${word}s?(?=$|[A-Z0-9_])`
  const upperCase = `(?:^|_)${word.toUpperCase()}S?(?=$|_)`
  const titleCase = `(?:^|(?<=[a-z0-9]))${toUpperFirst(word)}s?(?=$|[A-Z0-9_])`

  return `${lowerFirst}|${upperCase}|${titleCase}`
}
