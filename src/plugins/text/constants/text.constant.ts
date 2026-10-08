import type { TextOptions } from '../types/index.js'

/** Nothing: every list empty, so a rule given no options judges nothing and reports nothing. */
export const EMPTY_OPTIONS: TextOptions = {
  stringPatterns: [],
}
