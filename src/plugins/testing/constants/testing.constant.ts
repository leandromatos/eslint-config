import type { TestingOptions } from '../types/testing.type.js'

/** Nothing: every list empty and no HTTP kind, so a rule given no options judges nothing and reports nothing. */
export const EMPTY_OPTIONS: TestingOptions = {
  testFolder: '',
  mirroringTestKinds: [],
  suffixToFolder: {},
}
