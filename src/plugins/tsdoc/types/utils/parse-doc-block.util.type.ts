/** One block tag of a documentation comment, as the line that opens it and the lines that follow it read. */
export interface DocBlockTag {
  /** The name of the tag, without the at sign: `param`, `returns`, `throws`. */
  tag: string
  /** The line of the file the tag opens on. */
  line: number
  /** The index of that line inside the comment, which is where a fix rewrites it. */
  lineIndex: number
  /** What the tag carries between braces right after its name, and null when it carries none. */
  type: string | null
  /** The name a `@param` documents, with any brackets and default dropped, and an empty string on every other tag. */
  parameterName: string
  /** The text after the name, or after the tag when it names nothing, through the lines before the next tag. */
  description: string
}

/** A documentation comment, read as its main description and the block tags after it. */
export interface DocBlock {
  /** The text before the first block tag, trimmed. */
  description: string
  /** The line of the file the main description starts on, and the first line of the comment when there is none. */
  descriptionLine: number
  /** The block tags, in the order they are written. */
  tags: DocBlockTag[]
}

/** What a tag carries in braces after its name, split from what follows. */
export interface TypedTagContent {
  /** The text between the braces, and null when the tag opens with no brace. */
  type: string | null
  /** What follows the closing brace, or the whole content when there is no brace. */
  rest: string
}

/** The name a `@param` documents, split from the text that follows it. */
export interface NamedTagContent {
  /** The name, with any brackets and default dropped. */
  name: string
  /** What follows the name. */
  rest: string
}
