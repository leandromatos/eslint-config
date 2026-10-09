/** The messages `string-pattern` reports. */
export type StringPatternMessageId = 'mustMatch' | 'mustNotMatch'

/**
 * A string the code hands to a known call, and what it has to look like.
 *
 * The anchor is the callee as written, `this.logger.warn` or `ApiProperty` or
 * `new NotFoundException`; the string is the first argument, or the named property of it when the
 * first argument is an object. A template literal is judged with each expression replaced by
 * a placeholder.
 */
export interface StringPattern {
  /** The callee as the code writes it: `this.logger.warn`, `ApiProperty`, `new NotFoundException`. */
  callee: string
  /** The property of the first argument that holds the string, when the argument is an object. */
  property?: string
  /** A regular expression the name of the declaration the call decorates has to match, as its source. */
  target?: string
  /** A regular expression the string has to match, as its source. */
  must?: string
  /** A regular expression the string must not match, as its source. */
  mustNot?: string
  /** What the pattern says, for the message. */
  because: string
}

/** A pattern of the options with its regular expressions built, once per file. */
export interface CompiledStringPattern {
  /** The callee as the code writes it. */
  callee: string
  /** The property of the first argument that holds the string, when the argument is an object. */
  property?: string
  /** What the name of the declaration the call decorates has to match. */
  target?: RegExp
  /** What the string has to match. */
  must?: RegExp
  /** What the string must not match. */
  mustNot?: RegExp
  /** What the pattern says, for the message. */
  because: string
}
