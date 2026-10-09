/** The messages `type-suffix` reports. */
export type TypeSuffixMessageId = 'wrongFolder' | 'suffixInside'

/** A suffix the options govern, the folder of the mirror that owns it, and the pattern that finds it as a word. */
export interface GovernedSuffix {
  /** The suffix, such as `SelectAttributes`. */
  suffix: string
  /** The folder under the types folder whose files may end a type in it, such as `repositories`. */
  folder: string
  /** What finds the suffix as a whole word inside a name: `Meta` in `UserMeta`, not in `Metadata`. */
  pattern: RegExp
}
