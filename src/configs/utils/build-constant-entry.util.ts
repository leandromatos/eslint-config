import { CONSTANT_RULES } from '../../plugins/constants/index.js'
import { NAMESPACE, plugin } from '../../plugins/index.js'
import type { Config } from '../types/index.js'

/**
 * Builds the entry that judges the files of constants alone: every value written once, and an object built from
 * constants writing none in place. It names the plugin itself, since a file of constants may sit outside the sources
 * the other rules read.
 *
 * @param constantFiles - The files of constants.
 * @returns The configuration entry.
 */
export const buildConstantEntry = (constantFiles: string[]): Config => {
  const constantEntry: Config = {
    name: `${NAMESPACE}/constants`,
    files: constantFiles,
    plugins: { [NAMESPACE]: plugin },
    rules: Object.fromEntries(CONSTANT_RULES.map(({ name, group }) => [`${NAMESPACE}/${group}-${name}`, 'error'])),
  }

  return constantEntry
}
