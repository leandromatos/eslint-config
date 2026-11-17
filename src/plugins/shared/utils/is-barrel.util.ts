import fs from 'node:fs'
import path from 'node:path'

import { parse } from '@typescript-eslint/typescript-estree'

import { INDEX_FILES } from '../constants/source.constant.js'
import { markReExports } from './mark-re-exports.util.js'

/** The extensions a resolver tries on a path as a file before it reads the path as a directory. */
const FILE_EXTENSIONS = ['.ts', '.tsx', '.d.ts', '.js', '.jsx']

/**
 * Whether the directory an import names is a barrel: its index file holds at least one re-export.
 *
 * A path that is also a file, such as `src/users.ts` beside `src/users/`, resolves to the file. So the import does not
 * load the directory. The judge reads the index file a resolver loads first. An index file that does not parse is no
 * barrel, since the type-checker reports it. It reads the file at each call, so a running editor sees an edit.
 *
 * @param directory - The absolute path an import names.
 * @returns True for a barrel.
 */
export const isBarrel = (directory: string): boolean => {
  if (FILE_EXTENSIONS.some(extension => fs.existsSync(`${directory}${extension}`))) return false
  const indexFile = INDEX_FILES.map(index => path.join(directory, index)).find(candidate => fs.existsSync(candidate))
  if (!indexFile) return false
  try {
    const program = parse(fs.readFileSync(indexFile, 'utf8'), { filePath: indexFile, jsx: indexFile.endsWith('x') })

    return markReExports(program.body).length > 0
  } catch {
    return false
  }
}
