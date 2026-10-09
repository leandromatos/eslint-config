import { DEFAULT_IMPORT_ALIAS } from '../../shared/constants/index.js'
import type { ArchitectureOptions } from '../types/index.js'

/**
 * Nothing: every list empty, so a rule given no options judges nothing and reports nothing. The alias is the one an
 * import is read with when the configuration names none.
 */
export const EMPTY_OPTIONS: ArchitectureOptions = {
  alias: DEFAULT_IMPORT_ALIAS,
  suffixFreeFolders: [],
  coLocatedTypeSuffixes: [],
  suffixToFolder: {},
  folderlessSuffixes: [],
  effectHooks: [],
  definitionTimeDirectives: [],
  baseFolders: [],
  moduleContainers: [],
  barrelledContainers: [],
  mirrorFolders: [],
  rootContexts: [],
  executedFolders: [],
  typeSuffixes: {},
  orderedSuffixes: [],
  wholeArguments: [],
  testFolder: '',
  testingFolder: '',
  mockFolder: '',
  developmentSuffixes: [],
  testKinds: [],
  mirroringTestKinds: [],
}
