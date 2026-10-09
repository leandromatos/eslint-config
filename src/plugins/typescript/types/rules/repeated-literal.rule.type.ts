/** The messages `repeated-literal` reports. */
export type RepeatedLiteralMessageId = 'repeatedLiteral'

/** What `repeated-literal` takes, in the shape `sonarjs/no-duplicate-string` takes it. */
export interface RepeatedLiteralOptions {
  /** How many times a string is written before it is reported. */
  threshold: number
  /** The strings never reported, separated by commas. */
  ignoreStrings: string
}
