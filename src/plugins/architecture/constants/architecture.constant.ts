import type { ArchitectureOptions } from '../types/index.js'

/** Nothing: every list empty, so a rule given no options judges nothing and reports nothing. */
export const EMPTY_OPTIONS: ArchitectureOptions = {
  alias: '@',
  suffixFreeFolders: [],
  coLocatedTypeSuffixes: [],
  suffixToFolder: {},
  folderlessSuffixes: [],
  effectHooks: [],
  moduleContainers: [],
  barrelledContainers: [],
  mirrorFolders: [],
  rootContexts: [],
  executedFolders: [],
  typeSuffixes: {},
  orderedSuffixes: [],
  wholeArguments: [],
  testFolder: '',
  testKinds: [],
  mirroringTestKinds: [],
}
