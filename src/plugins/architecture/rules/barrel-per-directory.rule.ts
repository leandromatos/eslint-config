import fs from 'node:fs'
import path from 'node:path'

import { fileRule, firstSourceOf, moduleDepthOf, publishedDirectoriesOf } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'

/**
 * A directory that holds source files has a barrel, and a module root has none. Reported once
 * per directory. The root of `src/`, the root contexts, the test tree and the folders the options
 * name as executed directly are left out: nothing imports those by name.
 *
 * A directory the package publishes is left out too. Its barrel is the entrypoint the manifest
 * points at, so the rule reads `exports` rather than asking a project to name them again.
 */
export const barrelPerDirectory = fileRule(
  'A directory of source files has an index.ts; a module root has none.',
  'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/barrel-per-directory.md',
  {
    barrelAtRoot:
      'Module root "{{module}}/" carries an index.ts. Another module reaches its layers by name; remove the barrel.',
    missingBarrel:
      'Directory "{{directory}}/" holds source files and no index.ts. Add the barrel and export everything in it.',
  },
  (
    { file, segments, module },
    { rootContexts, testFolder, executedFolders, moduleContainers, barrelledContainers },
    context,
  ) => {
    if (segments.length === 0 || rootContexts.includes(module)) return []
    /* A container holds modules rather than sources, so it carries no barrel of its own. */
    if (segments.length === 1 && moduleContainers.includes(module)) return []
    if (segments.includes(testFolder) || segments.some(segment => executedFolders.includes(segment))) return []
    const directory = path.join(context.cwd, 'src', ...segments)
    if (file !== firstSourceOf(directory)) return []
    const hasBarrel = fs.existsSync(path.join(directory, 'index.ts'))
    /* A module of a barrelled container is imported whole, so its root is where its barrel belongs. */
    if (barrelledContainers.includes(module)) return []
    const isModuleRoot = segments.length === moduleDepthOf(segments, moduleContainers)
    /* A directory the package publishes is an entrypoint, and the barrel at its root is what that entrypoint names. */
    if (isModuleRoot && publishedDirectoriesOf(context.cwd).includes(module)) return []
    if (isModuleRoot && hasBarrel) return [{ messageId: 'barrelAtRoot', data: { module: segments.join('/') } }]
    if (!isModuleRoot && !hasBarrel) return [{ messageId: 'missingBarrel', data: { directory: segments.join('/') } }]

    return []
  },
  OPTIONS_SCHEMA,
  EMPTY_OPTIONS,
)
