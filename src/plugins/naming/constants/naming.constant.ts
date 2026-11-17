import type { NamingOptions } from '../types/naming.type.js'

/** Nothing: every list empty, so a rule given no options judges nothing and reports nothing. */
export const EMPTY_OPTIONS: NamingOptions = {
  roleNames: [],
  forbiddenNames: [],
  forbiddenWords: [],
  verbParticiples: {},
  valueCases: [],
  assertionMatchers: [],
  resourceSuffixes: [],
  resourceFreeStems: [],
  resourceFreeMethods: [],
  testFolder: '',
}
