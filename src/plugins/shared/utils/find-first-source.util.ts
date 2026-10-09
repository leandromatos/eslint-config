import fs from 'node:fs'

import { INDEX_FILES, SOURCE_FILE_REG_EXP } from '../constants/index.js'

/**
 * Finds the file a directory is reported on, so a finding about the directory appears once: its barrel when it has
 * one, else its first source file in name order.
 *
 * @param directory - The absolute path of the directory.
 * @returns The file name, and nothing for a directory holding no source.
 */
export const findFirstSource = (directory: string): string | undefined => {
  const files = fs
    .readdirSync(directory)
    .filter(name => SOURCE_FILE_REG_EXP.test(name))
    .sort()
  const barrel = files.find(name => INDEX_FILES.includes(name))
  if (barrel) return barrel

  return files[0]
}
