import { DEFAULT_IMPORT_ALIAS } from '../../shared/constants/index.js'
import type { TestingOptions } from '../types/index.js'

/**
 * Nothing: every list empty and no HTTP kind, so a rule given no options judges nothing and reports nothing. The alias
 * is the one a fix writes an import with when the configuration names none.
 */
export const EMPTY_OPTIONS: TestingOptions = {
  testFolder: '',
  testKinds: [],
  mirroringTestKinds: [],
  suffixToFolder: {},
  alias: DEFAULT_IMPORT_ALIAS,
}
