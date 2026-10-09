import { MissingFieldError } from '../errors/index.js'

/**
 * Reads the text a value parsed from JSON carries under a key, such as the name a manifest declares.
 *
 * @param value - The value, as the parser hands it back.
 * @param key - The key to read.
 * @returns The text.
 * @throws MissingFieldError When the field is missing or is not text.
 */
export const readTextField = (value: unknown, key: string): string => {
  const field = readField(value, key)
  if (typeof field !== 'string') throw new MissingFieldError(key)

  return field
}

/**
 * Reads what a value parsed from JSON carries under a key, without a cast: an object's own property, and nothing for
 * anything that is not an object.
 *
 * @param value - The value, as the parser hands it back.
 * @param key - The key to read.
 * @returns The field, still to be narrowed by the caller.
 */
export const readField = (value: unknown, key: string): unknown => {
  if (typeof value !== 'object' || value === null) return undefined
  const field: unknown = Object.getOwnPropertyDescriptor(value, key)?.value

  return field
}
