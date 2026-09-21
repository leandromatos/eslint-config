import { fileRule } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'

/** Every file carries a known suffix, and sits under the folder that suffix names. */
export const knownSuffix = fileRule(
  'A file is named by a known suffix and lives in the folder of that suffix.',
  'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/known-suffix.md',
  {
    noSuffix: '"{{file}}" carries no suffix. Name it {name}.{suffix}.ts with a suffix from the structure options.',
    unknownSuffix: 'Suffix ".{{suffix}}.ts" is not in the structure options. Add it there, or rename the file.',
    wrongFolder: '"{{file}}" belongs under {{folder}}/, not {{actual}}/.',
  },
  ({ file, suffix, segments }, { suffixToFolder, folderlessSuffixes, suffixFreeFolders, mirrorFolders }) => {
    if (file === 'index.ts' || file.endsWith('.d.ts') || segments.length === 0) return []
    /* A folder can say what its files are, which is how a React tree names a component after the function in it. */
    if (segments.some(segment => suffixFreeFolders.includes(segment))) return []
    if (!suffix) return [{ messageId: 'noSuffix', data: { file } }]
    if (folderlessSuffixes.includes(suffix)) return []
    const folder = suffixToFolder[suffix]
    if (!folder) return [{ messageId: 'unknownSuffix', data: { suffix } }]
    /* A mirror holds files of other layers by definition, so the folder of the suffix is not where they sit. */
    if (segments.some(segment => mirrorFolders.includes(segment))) return []
    if (!segments.includes(folder))
      return [{ messageId: 'wrongFolder', data: { file, folder, actual: segments.join('/') } }]

    return []
  },
  OPTIONS_SCHEMA,
  EMPTY_OPTIONS,
)
