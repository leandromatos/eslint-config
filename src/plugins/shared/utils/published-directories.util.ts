import fs from 'node:fs'
import path from 'node:path'

/** What a package answers with when it publishes nothing by path. */
const NONE: string[] = []

/** The directories each package publishes, by the directory the run was started from. */
const byWorkingDirectory = new Map<string, string[]>()

/**
 * The directories a package publishes as entrypoints, read from its `package.json`.
 *
 * `"./cache"` and `"./cache/testing"` both name `cache`, and `"./schemas/*"` names `schemas`. `"."` names no
 * directory: it is the package itself. An application publishes nothing by path and gets an empty list.
 *
 * @param cwd - The directory the run was started from, which holds `package.json`.
 * @returns The directory names, each appearing once.
 */
export const publishedDirectoriesOf = (cwd: string): string[] => {
  const known = byWorkingDirectory.get(cwd)
  if (known) return known
  const manifest = path.join(cwd, 'package.json')
  if (!fs.existsSync(manifest)) return NONE
  const { exports: entrypoints } = JSON.parse(fs.readFileSync(manifest, 'utf8')) as { exports?: unknown }
  const directories = readDirectories(entrypoints)
  byWorkingDirectory.set(cwd, directories)

  return directories
}

/**
 * The first segment of every entrypoint path a package declares.
 *
 * @param entrypoints - What the manifest carries under `exports`.
 * @returns The directory names, each appearing once.
 */
const readDirectories = (entrypoints: unknown): string[] => {
  if (!entrypoints || typeof entrypoints !== 'object') return NONE
  const names = Object.keys(entrypoints)
    .filter(entrypoint => entrypoint.startsWith('./'))
    .map(entrypoint => entrypoint.slice(2).split('/')[0])
    .filter((name): name is string => Boolean(name) && name !== '*')

  return [...new Set(names)]
}
