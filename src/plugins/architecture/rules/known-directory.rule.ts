import path from 'node:path'

import { carriesResponsibilities, fileRule, firstSourceOf, moduleDepthOf } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'

/**
 * Every directory under a module is on the closed list. A directory is reported once, on its
 * barrel or on its first file, rather than on every file inside it. The mock folder is on the list
 * wherever it sits: the test runner and the catalog name it, beside the module it stands in for. So is the testing
 * folder, which holds what a package publishes for tests under a subpath of its own. A base folder is on the list
 * at the root of a module, which is the one place it holds the base classes of that module.
 *
 * A directory at the root of a module that holds layers of its own is a context, the way a driver sits in the
 * capability it implements: `cache/keyv/` with its `services/` and `types/`. The list judges what is inside it.
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
    {
      suffixToFolder,
      mirrorFolders,
      testKinds,
      mockFolder,
      testingFolder,
      rootContexts,
      moduleContainers,
      baseFolders,
    },
  ) => {
    if (rootContexts.includes(module)) return []
    const known = new Set([...Object.values(suffixToFolder), ...mirrorFolders, ...testKinds, mockFolder, testingFolder])
    const depth = moduleDepthOf(segments, moduleContainers)
    const responsibilities = [...Object.values(suffixToFolder), ...mirrorFolders]
    const isOwnedByModule = (directory: string, index: number): boolean =>
      index === 0 &&
      (baseFolders.includes(directory) ||
        carriesResponsibilities(path.join(sourceRoot, ...segments.slice(0, depth + 1)), responsibilities))
    const offending = segments
      .slice(depth)
      .filter((directory, index) => !known.has(directory) && !isOwnedByModule(directory, index))
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
