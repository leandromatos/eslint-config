import type { SUFFIX_DICTIONARY } from '../../constants/index.js'

/**
 * A suffix the dictionary carries: a key of {@link SUFFIX_DICTIONARY}.
 *
 * A vocabulary cut from the dictionary is annotated with this, so a suffix the dictionary loses stops compiling
 * where it is still named rather than going quiet and turning a rule off.
 */
export type DictionarySuffix = keyof typeof SUFFIX_DICTIONARY

/**
 * The suffixes of a vocabulary cut from the dictionary, each paired with the folder {@link SUFFIX_DICTIONARY} gives it.
 */
export type FolderMap<TSuffixes extends readonly DictionarySuffix[]> = {
  [TSuffix in TSuffixes[number]]: (typeof SUFFIX_DICTIONARY)[TSuffix]
}
