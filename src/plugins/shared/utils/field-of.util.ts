/**
 * What a value parsed from JSON carries under a key, read without a cast: an object's own property, and nothing for
 * anything that is not an object.
 *
 * @param value - The value, as the parser hands it back.
 * @param key - The key to read.
 * @returns The field, still to be narrowed by the caller.
 */
export const fieldOf = (value: unknown, key: string): unknown => {
  if (typeof value !== 'object' || value === null) return undefined
  const field: unknown = Object.getOwnPropertyDescriptor(value, key)?.value

  return field
}
