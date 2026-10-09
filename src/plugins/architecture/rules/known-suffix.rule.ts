import { INDEX_FILES } from '../../shared/constants/index.js'
import {
  buildFinding,
  buildRuleDocsUrl,
  countModuleDepth,
  createFileRule,
  isContextRoot,
} from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'

/**
 * Every file carries a known suffix, and sits under the folder that suffix names. A stand-in in the mock folder
 * carries the name of what it imitates, as the test runner reads it: `zustand.ts`, `@gorhom/bottom-sheet.tsx`.
 */
export const knownSuffix = createFileRule(
  'A file is named by a known suffix and lives in the folder of that suffix.',
  buildRuleDocsUrl('architecture', 'known-suffix'),
  {
    noSuffix: '"{{file}}" carries no suffix. Name it after its layer, with a suffix from architecture.suffixToFolder.',
    unknownSuffix: 'Suffix ".{{suffix}}" is not in architecture.suffixToFolder. Add it there, or rename the file.',
    wrongFolder: '"{{file}}" belongs under {{folder}}/, not {{actual}}/.',
  },
  (
    { sourceRoot, file, stem, suffix, segments },
    { suffixToFolder, folderlessSuffixes, suffixFreeFolders, mirrorFolders, baseFolders, moduleContainers, mockFolder },
  ) => {
    if (INDEX_FILES.includes(file) || file.endsWith('.d.ts') || segments.length === 0) return []
    // The test runner reads a stand-in by the name of what it imitates, a package's or a module's, so it stays.
    if (mockFolder && segments.includes(mockFolder)) return []
    // A folder can say what its files are, which is how a React tree names a component after the function in it.
    if (segments.some(segment => suffixFreeFolders.includes(segment))) return []
    // A base folder at the root of a module holds base classes, which are named for what they are.
    if (baseFolders.includes(segments[countModuleDepth(segments, moduleContainers)] ?? '')) return []
    if (!suffix) return [buildFinding('noSuffix', { file })]
    if (folderlessSuffixes.includes(suffix)) return []
    const folder = suffixToFolder[suffix]
    if (!folder) return [buildFinding('unknownSuffix', { suffix })]
    // A mirror holds files of other layers by definition, so the folder of the suffix is not where they sit.
    if (segments.some(segment => mirrorFolders.includes(segment))) return []
    if (segments.includes(folder)) return []
    // A file named after the context it sits in is that context's root file, so it sits above the layers.
    const folders = [...Object.values(suffixToFolder), ...mirrorFolders]
    if (isContextRoot(sourceRoot, segments, stem, folders)) return []

    return [buildFinding('wrongFolder', { file, folder, actual: segments.join('/') })]
  },
  OPTIONS_SCHEMA,
  EMPTY_OPTIONS,
)
