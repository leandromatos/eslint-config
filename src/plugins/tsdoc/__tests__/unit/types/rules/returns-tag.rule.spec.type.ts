/** A case of the suite, placed in a source file of the fixture project. */
export type PlacedCase<TCase> = TCase & { filename: string }
