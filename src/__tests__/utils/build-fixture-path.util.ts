import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Builds the path of a fixture tree, which sits in the `fixtures` folder of the `__tests__` tree a spec belongs to.
 *
 * @param specUrl - The `import.meta.url` of the spec, under `__tests__/<kind>/<folder>/`.
 * @param segments - The tree, and any directory inside it.
 * @returns The absolute path.
 */
export const buildFixturePath = (specUrl: string, ...segments: string[]): string =>
  path.join(path.dirname(fileURLToPath(specUrl)), '..', '..', 'fixtures', ...segments)
