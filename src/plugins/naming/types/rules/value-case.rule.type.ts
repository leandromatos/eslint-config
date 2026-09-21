/** The messages `value-case` reports. */
export type ValueCaseMessageId = 'wrongCase'

/** The casing a string value keeps. */
export type ValueCasing = 'camelCase' | 'kebab-case'

/**
 * A string value governed by the name it is declared under: a constant or a class property whose
 * name ends in `endsWith` holds a string in `casing`, or, when `deep`, an object whose string
 * values do.
 */
export interface ValueCase {
  /** The ending of the name that governs the value, such as `QueueName`. */
  endsWith: string
  /** The casing the value keeps. */
  casing: ValueCasing
  /** Whether the values of an object are judged too, rather than the literal alone. */
  deep: boolean
}
