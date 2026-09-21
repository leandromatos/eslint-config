import type { TypescriptOptions } from '../types/index.js'

/** Nothing: no suffix names the file a vocabulary lives in, so the rule judges where nothing is declared. */
export const EMPTY_OPTIONS: TypescriptOptions = {
  typeSuffix: '',
}
