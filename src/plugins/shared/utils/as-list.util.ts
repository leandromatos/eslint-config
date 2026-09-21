/**
 * A value as a list: itself when it is one, and a list of one when it is not.
 *
 * A walk over an AST reads properties that hold either a node or a list of them, and this is what lets the two be
 * read the same way.
 *
 * @param value - What the property holds.
 * @returns The list.
 */
export const asList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value

  return [value]
}
