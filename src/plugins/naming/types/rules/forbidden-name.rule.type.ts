/** The messages `forbidden-name` reports: a whole name the options forbid, or a word of one. */
export type ForbiddenNameMessageId = 'forbiddenName' | 'forbiddenWord'

/** A name no declaration carries whole, and why: one that is wrong on its own and fine inside a longer name. */
export interface ForbiddenName {
  /** The name, as a declaration would spell it. */
  name: string
  /** What the message says the name gets wrong. */
  because: string
}

/** Where in a name a forbidden word is refused: in any position, or as the last word, the suffix of the name. */
export type ForbiddenWordPosition = 'anywhere' | 'last'

/** A word no name carries, and why: a segment of a camel-case, Pascal-case or snake-case name. */
export interface ForbiddenWord {
  /** The word, in lower case. */
  word: string
  /** What the message says the word gets wrong. */
  because: string
  /** Where the word is refused; in any position when the entry names none. */
  position?: ForbiddenWordPosition
}
