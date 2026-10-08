import type { TsdocOptions } from '../types/index.js'

/** Nothing: every list empty, so a rule given no options judges nothing and reports nothing. */
export const EMPTY_OPTIONS: TsdocOptions = {
  commentWidth: 0,
  testFolder: '',
  frameworkSymbols: [],
  requiredTagContexts: [],
}

/** The tags that write a parameter or a value back, which is where JSDoc puts a type in braces. */
export const TYPED_TAGS = new Set(['param', 'arg', 'argument', 'returns', 'return'])

/** The tags whose description reads as a sentence, beside the main description. */
export const SENTENCE_TAGS = new Set(['param', 'returns', 'throws'])
