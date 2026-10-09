import type { Config } from '../types/index.js'

/**
 * Reads the entries under the directory of one package of a monorepo, so their globs name that package's files.
 *
 * @param entries - The entries of a tier.
 * @param basePath - The directory of the package, from the root of the repository, and nothing for the repository
 * itself.
 * @returns The entries, under the package.
 */
export const placeInPackage = (entries: Config[], basePath: string | undefined): Config[] => {
  if (!basePath) return entries
  const placed = entries.map(entry => ({ ...entry, basePath }))

  return placed
}
