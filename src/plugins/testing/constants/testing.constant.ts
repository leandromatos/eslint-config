import type { TestingOptions } from '../types/index.js'

/** Nothing: every list empty, so a rule given no options judges nothing and reports nothing. */
export const EMPTY_OPTIONS: TestingOptions = {
  testFolder: '',
  testKinds: [],
  mirroringTestKinds: [],
  suffixToFolder: {},
  httpTest: { kind: '', client: '' },
}
