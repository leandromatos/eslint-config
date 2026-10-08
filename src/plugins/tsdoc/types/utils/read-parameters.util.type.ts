/**
 * How a parameter is declared, which decides what a `@param` has to say about it.
 *
 * A named parameter is documented by its name, a rest parameter by its name too, and a destructured one by any name
 * the comment gives it at its position.
 */
export const ParameterKind = {
  NAMED: 'NAMED',
  REST: 'REST',
  DESTRUCTURED: 'DESTRUCTURED',
} as const

/** The kind of a declared parameter, derived from {@link ParameterKind}. */
export type ParameterKind = (typeof ParameterKind)[keyof typeof ParameterKind]

/** One parameter of a function, as a comment documents it. */
export interface Parameter {
  /** The name a `@param` writes for it, and an empty string for a destructured one, which has none. */
  name: string
  /** How it is declared. */
  kind: ParameterKind
}
