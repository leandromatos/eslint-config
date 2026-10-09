import path from 'node:path'

import {
  buildFinding,
  buildRuleDocsUrl,
  carriesResponsibilities,
  countModuleDepth,
  createFileRule,
  findFirstSource,
} from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'

/**
 * Every directory under a module is on the closed list. A directory is reported once, on its barrel or on its first
 * file, rather than on every file inside it. The mock folder is on the list wherever it sits: the test runner and the
 * catalog name it, beside the module it stands in for. So is the testing folder, which holds what a package publishes
 * for tests under a subpath of its own. Below the mock folder, a directory is part of the path of what a stand-in
 * imitates, as the scope of `@gorhom/bottom-sheet.tsx` is. A base folder is on the list at the root of a module, which
 * is the one place it holds the base classes of that module, and so is its mirror: `types/core/` and
 * `__tests__/unit/core/` mirror the `core/` beside them.
 *
 * A directory at the root of a module that holds layers of its own is a context, the way a driver sits in the
 * capability it implements: `cache/keyv/` with its `services/` and `types/`. The list judges what is inside it.
 */
export const knownDirectory = createFileRule(
  'A module holds only the directories the options name.',
  buildRuleDocsUrl('architecture', 'known-directory'),
  {
    unknownDirectory:
      'Directory "{{directory}}" is not on the list of responsibility directories. Add it to architecture.suffixToFolder or architecture.mirrorFolders, or move its files.',
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
    const depth = countModuleDepth(segments, moduleContainers)
    const responsibilities = [...Object.values(suffixToFolder), ...mirrorFolders]
    const inner = segments.slice(depth)
    const mirrorsModuleRoot = (index: number): boolean =>
      inner.slice(0, index).every(directory => mirrorFolders.includes(directory) || testKinds.includes(directory))
    const isOwnedByModule = (directory: string, index: number): boolean => {
      if (baseFolders.includes(directory)) return mirrorsModuleRoot(index)
      if (index > 0) return false

      return carriesResponsibilities(path.join(sourceRoot, ...segments.slice(0, depth + 1)), responsibilities)
    }
    // Below the mock folder the path is the one of what a stand-in imitates, such as the scope of a package.
    const mockAt = inner.indexOf(mockFolder)
    const isImitated = (index: number): boolean => mockFolder !== '' && mockAt >= 0 && index > mockAt
    const offending = inner.filter(
      (directory, index) => !known.has(directory) && !isImitated(index) && !isOwnedByModule(directory, index),
    )
    const lastOffending = offending.at(-1)
    if (!lastOffending) return []
    const nearest = segments.lastIndexOf(lastOffending)
    const directory = path.join(sourceRoot, ...segments.slice(0, nearest + 1))
    const isReporter = file === findFirstSource(directory) && segments.length === nearest + 1
    if (!isReporter) return []

    return offending.map(directory => buildFinding('unknownDirectory', { directory }))
  },
  OPTIONS_SCHEMA,
  EMPTY_OPTIONS,
)
