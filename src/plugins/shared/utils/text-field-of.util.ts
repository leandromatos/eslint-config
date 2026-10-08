import { fieldOf } from './field-of.util.js'

/**
 * The text a value parsed from JSON carries under a key, such as the name a manifest declares.
 *
 * @param value - The value, as the parser hands it back.
 * @param key - The key to read.
 * @returns The text.
 * @throws Error When the field is missing or is not text.
 */
export const textFieldOf = (value: unknown, key: string): string => {
  const field = fieldOf(value, key)
  if (typeof field !== 'string') throw new Error(`The value carries no text under "${key}".`)

  return field
}
