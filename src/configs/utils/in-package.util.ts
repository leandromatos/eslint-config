import type { Config } from '../types/index.js'

/**
 * The entries, each read under the directory of one package of a monorepo, so their globs name that package's files.
 *
 * @param entries - The entries of a tier.
 * @param basePath - The directory of the package, from the root of the repository, and nothing for the repository
 * itself.
 * @returns The entries, under the package.
 */
export const inPackage = (entries: Config[], basePath: string | undefined): Config[] => {
  if (!basePath) return entries

  return entries.map(entry => ({ ...entry, basePath }))
}
