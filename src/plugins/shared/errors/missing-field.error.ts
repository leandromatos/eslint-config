/** Thrown when a value parsed from JSON, such as the manifest of this package, carries no text under a key it needs. */
export class MissingFieldError extends Error {
  /**
   * Builds the error from the key that came back empty.
   *
   * @param key - The key the value carries no text under.
   */
  constructor(readonly key: string) {
    super(`The value carries no text under "${key}".`)
    this.name = 'MissingFieldError'
  }
}
