import type { TsdocOptions } from '../types/index.js'

/** Nothing: no column, and no tool that reads the release tags. */
export const EMPTY_OPTIONS: TsdocOptions = {
  commentWidth: 0,
  readsReleaseTags: false,
}

/** The tags that write a parameter or a value back, which is where JSDoc puts a type in braces. */
export const TYPED_TAGS = new Set(['param', 'arg', 'argument', 'returns', 'return'])

/** The tags whose description reads as a sentence, beside the main description. */
export const SENTENCE_TAGS = new Set(['param', 'returns', 'throws'])
