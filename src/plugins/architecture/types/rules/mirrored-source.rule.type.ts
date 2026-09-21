/** Where a mirrored file sits, as `mirrored-source` reads it. */
export interface MirrorShape {
  /** The directory the mirror folder sits in. */
  base: string
  /** The directories between the mirror folder and the file. */
  inner: string[]
  /** The file name before its suffix. */
  stem: string
  /** The file sits in the test folder itself. */
  isTestTree: boolean
  /** The mirror folder sits inside one kind of the test folder, so it mirrors that kind's tree. */
  isInsideTestKind: boolean
  /** The mirror folder sits inside the test folder, so the tree beside it is the test tree. */
  isInsideTestTree: boolean
}
