/** The messages `argument-passed-whole` reports. */
export type ArgumentPassedWholeMessageId = 'unwrapped'

/** In files of one suffix, the objects that are passed on whole. */
export interface WholeArgument {
  /** The file suffix the rule judges, such as `controller`. */
  suffix: string
  /** The names of the objects this layer passes on whole, such as `params`. */
  objects: string[]
}
