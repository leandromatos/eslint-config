/**
 * Thrown where a configuration is written, when its folder vocabulary disagrees with the dictionary: a known suffix
 * spelled into another folder, or a suffix no dictionary carries.
 */
export class FolderVocabularyError extends Error {
  /**
   * Builds the error from every disagreement at once, so one run says everything to fix.
   *
   * @param problems - One sentence per suffix that disagrees.
   */
  constructor(readonly problems: string[]) {
    super(`The folder vocabulary disagrees with the dictionary:\n- ${problems.join('\n- ')}`)
    this.name = 'FolderVocabularyError'
  }
}
