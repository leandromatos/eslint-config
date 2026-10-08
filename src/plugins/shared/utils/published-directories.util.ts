import fs from 'node:fs'
import path from 'node:path'

import { fieldOf } from './field-of.util.js'

/** What a package answers with when it publishes nothing by path. */
const NONE: string[] = []

/** The directories each package publishes, by the directory of the package. */
const byPackage = new Map<string, string[]>()

/**
 * The directories a package publishes as entrypoints, read from its `package.json`.
 *
 * `"./cache"` and `"./cache/testing"` both name `cache`, and `"./schemas/*"` names `schemas`. `"."` names no
 * directory by its key, but its target does: `"./dist/tokens/index.js"` is the build of the `tokens` directory, so
 * the barrel there is what the package publishes. An application publishes nothing by path and gets an empty list.
 *
 * @param packageRoot - The directory of the package, which holds `package.json`.
 * @returns The directory names, each appearing once.
 */
export const publishedDirectoriesOf = (packageRoot: string): string[] => {
  const known = byPackage.get(packageRoot)
  if (known) return known
  const manifest = path.join(packageRoot, 'package.json')
  if (!fs.existsSync(manifest)) return NONE
  const parsed: unknown = JSON.parse(fs.readFileSync(manifest, 'utf8'))
  const directories = readDirectories(fieldOf(parsed, 'exports'))
  byPackage.set(packageRoot, directories)

  return directories
}

/**
 * The first segment of every entrypoint path a package declares, and the directory under the build folder that each
 * target is built from.
 *
 * @param entrypoints - What the manifest carries under `exports`.
 * @returns The directory names, each appearing once.
 */
const readDirectories = (entrypoints: unknown): string[] => {
  if (!entrypoints || typeof entrypoints !== 'object') return NONE
  const keys = Object.keys(entrypoints)
    .filter(entrypoint => entrypoint.startsWith('./'))
    .map(entrypoint => entrypoint.slice(2).split('/')[0])
  const built = targetsOf(entrypoints).map(target => target.replace(/^\.\//, '').split('/'))
  const sources = built.filter(segments => segments.length > 2).map(segments => segments[1])
  const names = [...keys, ...sources].filter((name): name is string => Boolean(name) && name !== '*')

  return [...new Set(names)]
}

/**
 * Every path an entrypoint resolves to, through the conditions it nests.
 *
 * @param value - An entrypoint, a condition, or a target.
 * @returns The targets.
 */
const targetsOf = (value: unknown): string[] => {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []

  return Object.values(value).flatMap(targetsOf)
}
