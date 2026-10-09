import type { AGNOSTIC_SUFFIX_DICTIONARY, SUFFIX_DICTIONARY } from '../../constants/index.js'

/**
 * A suffix the dictionary carries: a key of {@link SUFFIX_DICTIONARY}.
 *
 * A default that names a layer is checked against this, so a suffix the dictionary loses stops compiling where it is
 * still named rather than going quiet and turning a rule off.
 */
export type DictionarySuffix = keyof typeof SUFFIX_DICTIONARY

/** A suffix of the agnostic layer: a key of {@link AGNOSTIC_SUFFIX_DICTIONARY}, which every tier reads. */
export type AgnosticSuffix = keyof typeof AGNOSTIC_SUFFIX_DICTIONARY
