import fs from 'node:fs'
import path from 'node:path'

import { INDEX_FILES } from '../../shared/constants/index.js'
import {
  buildFinding,
  buildRuleDocsUrl,
  countModuleDepth,
  createFileRule,
  findFirstSource,
  readPublishedDirectories,
} from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'

/**
 * A directory that holds source files has a barrel, and a module root has none. Reported once
 * per directory. The source root, the root contexts, the test tree, the mock folder and the
 * folders the options name as executed directly are left out: nothing imports those by name.
 *
 * A directory the package publishes is left out too. Its barrel is the entrypoint the manifest
 * points at, so the rule reads `exports` rather than asking a project to name them again.
 */
export const barrelPerDirectory = createFileRule(
  'A directory of source files has an index.ts; a module root has none.',
  buildRuleDocsUrl('architecture', 'barrel-per-directory'),
  {
    barrelAtRoot:
      'Module root "{{module}}/" carries an index.ts. Another module reaches its layers by name; remove the barrel.',
    missingBarrel:
      'Directory "{{directory}}/" holds source files and no index.ts. Add the barrel and export everything in it.',
  },
  (
    { packageRoot, sourceRoot, file, segments, module },
    { rootContexts, testFolder, mockFolder, executedFolders, moduleContainers, barrelledContainers, mirrorFolders },
  ) => {
    if (segments.length === 0 || rootContexts.includes(module)) return []
    // A container holds modules rather than sources, so it carries no barrel of its own.
    if (segments.length === 1 && moduleContainers.includes(module)) return []
    // A mirror at the source root holds the types of the files beside it, so it is a context rather than a module.
    if (mirrorFolders.includes(module)) return []
    if (segments.includes(testFolder) || segments.includes(mockFolder)) return []
    if (segments.some(segment => executedFolders.includes(segment))) return []
    const directory = path.join(sourceRoot, ...segments)
    if (file !== findFirstSource(directory)) return []
    const hasBarrel = INDEX_FILES.some(index => fs.existsSync(path.join(directory, index)))
    // A module of a barrelled container is imported whole, so its root is where its barrel belongs.
    if (barrelledContainers.includes(module)) return []
    const isModuleRoot = segments.length === countModuleDepth(segments, moduleContainers)
    // A directory the package publishes is an entrypoint, and the barrel at its root is what that entrypoint names.
    if (isModuleRoot && readPublishedDirectories(packageRoot).includes(module)) return []
    if (isModuleRoot && hasBarrel) return [buildFinding('barrelAtRoot', { module: segments.join('/') })]
    if (!isModuleRoot && !hasBarrel) return [buildFinding('missingBarrel', { directory: segments.join('/') })]

    return []
  },
  OPTIONS_SCHEMA,
  EMPTY_OPTIONS,
)
