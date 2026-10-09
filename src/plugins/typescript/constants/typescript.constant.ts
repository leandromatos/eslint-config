import type { RepeatedLiteralOptions, TypescriptOptions } from '../types/index.js'

/** Nothing: no suffix names the file a vocabulary lives in, so the rules judge no file. */
export const EMPTY_OPTIONS: TypescriptOptions = {
  typeSuffix: '',
}

/** A string is reported the second time it is written, since a file of constants writes each value once. */
export const DEFAULT_REPEATED_LITERAL_OPTIONS: RepeatedLiteralOptions = {
  threshold: 2,
  ignoreStrings: '',
}
