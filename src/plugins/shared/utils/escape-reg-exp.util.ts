/**
 * Escapes the characters a regular expression reads as syntax, so a word from the options matches itself.
 *
 * @param text - The text to match literally.
 * @returns The source of a pattern that matches the text and nothing else.
 */
export const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
