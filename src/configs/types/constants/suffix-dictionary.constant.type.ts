import type { SUFFIX_DICTIONARY } from '../../constants/index.js'

/**
 * A suffix the dictionary carries: a key of {@link SUFFIX_DICTIONARY}.
 *
 * A vocabulary cut from the dictionary is annotated with this, so a suffix the dictionary loses stops compiling
 * where it is still named rather than going quiet and turning a rule off.
 */
export type DictionarySuffix = keyof typeof SUFFIX_DICTIONARY
