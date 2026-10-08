import path from 'node:path'

import { fileRule, firstSourceOf, moduleDepthOf } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'

/**
 * Every directory under a module is on the closed list. A directory is reported once, on its
 * barrel or on its first file, rather than on every file inside it. The mock folder is on the list
 * wherever it sits: the test runner and the catalog name it, beside the module it stands in for. So is the testing
 * folder, which holds what a package publishes for tests under a subpath of its own.
 */
export const knownDirectory = fileRule(
  'A module holds only the directories the options name.',
  'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/known-directory.md',
  {
    unknownDirectory:
      'Directory "{{directory}}" is not on the list of responsibility directories. Add it to the structure options, or move its files.',
  },
  (
    { sourceRoot, file, segments, module },
    { suffixToFolder, mirrorFolders, testKinds, mockFolder, testingFolder, rootContexts, moduleContainers },
  ) => {
    if (rootContexts.includes(module)) return []
    const known = new Set([...Object.values(suffixToFolder), ...mirrorFolders, ...testKinds, mockFolder, testingFolder])
    const offending = segments
      .slice(moduleDepthOf(segments, moduleContainers))
      .filter(directory => !known.has(directory))
    if (offending.length === 0) return []
    /* v8 ignore next -- the list is not empty here: the rule returned already when it was */
    const nearest = segments.lastIndexOf(offending[offending.length - 1] ?? '')
    const directory = path.join(sourceRoot, ...segments.slice(0, nearest + 1))
    const isReporter = file === firstSourceOf(directory) && segments.length === nearest + 1
    if (!isReporter) return []

    return offending.map(name => ({ messageId: 'unknownDirectory' as const, data: { directory: name } }))
  },
  OPTIONS_SCHEMA,
  EMPTY_OPTIONS,
)
