import fs from 'node:fs'
import path from 'node:path'

import { INDEX_FILES } from '../constants/source.constant.js'
import type { Location } from '../types/shared.type.js'
import type { ExportTarget, ManifestTargets } from '../types/utils/is-published-entrypoint.util.type.js'
import { escapeRegExp } from './escape-reg-exp.util.js'
import { readField } from './json-field.util.js'

/** The extension a source file carries: `.ts`, `.tsx`, or `.d.ts`. */
const SOURCE_EXTENSION_REG_EXP = /\.(d\.)?[^./]+$/

/** The extensions a target names a source file under: what a build writes for it, or the source itself. */
const TARGET_EXTENSIONS = ['.js', '.mjs', '.cjs', '.jsx', '.d.ts', '.d.mts', '.d.cts', '.ts', '.tsx']

/** The extensions a source file takes, which tell a build folder of a target from a folder of the sources. */
const SOURCE_EXTENSIONS = ['.ts', '.tsx']

/** The end of the path of an index file, which a bundler builds under the name of its directory. */
const INDEX_MODULE_REG_EXP = /\/index$/

/** The byte order mark an editor may write at the start of a manifest, which `JSON.parse` rejects and Node skips. */
const BYTE_ORDER_MARK_REG_EXP = /^\uFEFF/

/** The targets of each package, by the directory of the package, with the manifest time they hold for. */
const targetsByPackage = new Map<string, ManifestTargets>()

/**
 * Whether a file is a published entrypoint, which may re-export. The index file at the source root is one. So is a
 * source file that a target of the `exports` of `package.json` is built from.
 *
 * Only targets name a file, so a key that a target does not back publishes nothing. The function skips a key set to
 * `null`. The leading folders of a target are its build folders. The shortest run of them that names a file or a
 * folder of the sources wins. So `./dist/esm/cache` reads as the build of `src/cache` when `src/esm` does not exist. A
 * target such as `./dist/cache.js` builds `src/cache.ts`, or else `src/cache/index.ts`. Under a key that holds a `*`,
 * a `*` of the target stands for any text, slashes included, as Node reads it. Under any other key, a `*` is a plain
 * character. The rule reads the entries of `package.json` again whenever the manifest changes. It reads the sources at
 * each call, so a running editor sees a new file. A manifest that does not parse publishes nothing.
 *
 * @param location - Where the file sits.
 * @returns True for a published entrypoint.
 */
export const isPublishedEntrypoint = ({
  packageRoot,
  sourceRoot,
  file,
  segments,
}: Pick<Location, 'file' | 'packageRoot' | 'segments' | 'sourceRoot'>): boolean => {
  if (segments.length === 0 && INDEX_FILES.includes(file)) return true
  const sourceModule = [...segments, file.replace(SOURCE_EXTENSION_REG_EXP, '')].join('/')
  const builtModules = [sourceModule, sourceModule.replace(INDEX_MODULE_REG_EXP, '')]

  return readTargets(packageRoot).some(target => buildsModule(target, sourceRoot, builtModules))
}

/**
 * Reads the targets of the `exports` of a package, from the manifest or from what an earlier read cached.
 *
 * @param packageRoot - The directory of the package, which holds `package.json`.
 * @returns The targets, and none for a package with no manifest or one that does not parse.
 */
const readTargets = (packageRoot: string): readonly ExportTarget[] => {
  const manifest = path.join(packageRoot, 'package.json')
  if (!fs.existsSync(manifest)) return []
  const { mtimeMs } = fs.statSync(manifest)
  const known = targetsByPackage.get(packageRoot)
  if (known?.mtimeMs === mtimeMs) return known.targets
  const targets = listTargets(readExports(manifest))
  targetsByPackage.set(packageRoot, { mtimeMs, targets })

  return targets
}

/**
 * Whether a target is the build of a source file: the target, under its build folder, names that file. A target such
 * as `dist/cache.js` is also the build of `src/cache/index.ts`, as a bundler names the build of an index file.
 *
 * @param exportTarget - A path the `exports` resolve to, and whether its `*` stands for any text.
 * @param sourceRoot - The directory the package keeps its sources in.
 * @param builtModules - The source file, by its path under the source root with no extension, and for an index file
 * also the path of its directory.
 * @returns True when the target builds the file.
 */
const buildsModule = ({ target, isPattern }: ExportTarget, sourceRoot: string, builtModules: string[]): boolean => {
  const pattern = target.replace(/^\.\//, '')
  const segments = pattern.split('/')
  const buildFolder = segments
    .slice(0, -1)
    .map((_segment, at) => segments.slice(0, at + 1).join('/'))
    .filter(folder => !isPattern || !folder.includes('*'))
    .find(folder => namesSources(pattern.slice(folder.length + 1), sourceRoot, isPattern))
  if (buildFolder === undefined) return false
  const targetRegExp = buildTargetRegExp(pattern, isPattern)

  return builtModules.some(builtModule =>
    TARGET_EXTENSIONS.some(extension => targetRegExp.test(`${buildFolder}/${builtModule}${extension}`)),
  )
}

/**
 * Whether the rest of a target, past a candidate build folder, names something of the sources: the source file it is
 * the build of, the index file of a directory of that name, or the folder of the sources its `*` stands under.
 *
 * @param tail - The target past the candidate build folder.
 * @param sourceRoot - The directory the package keeps its sources in.
 * @param isPattern - Whether the `*` of the target stands for any text.
 * @returns True when the sources hold what the tail names.
 */
const namesSources = (tail: string, sourceRoot: string, isPattern: boolean): boolean => {
  const wildcardAt = tail.indexOf('*')
  if (isPattern && wildcardAt >= 0)
    return fs.existsSync(path.join(sourceRoot, tail.slice(0, tail.lastIndexOf('/', wildcardAt) + 1)))
  const sourceModule = tail.replace(SOURCE_EXTENSION_REG_EXP, '')

  return [sourceModule, `${sourceModule}/index`].some(candidate =>
    SOURCE_EXTENSIONS.some(extension => fs.existsSync(path.join(sourceRoot, `${candidate}${extension}`))),
  )
}

/**
 * Builds what tells the paths a target names: the target itself, or for a pattern, the target with any text where it
 * holds a `*`.
 *
 * @param pattern - The target, with no leading `./`.
 * @param isPattern - Whether its `*` stands for any text.
 * @returns The regular expression.
 */
const buildTargetRegExp = (pattern: string, isPattern: boolean): RegExp => {
  const escapedPattern = escapeRegExp(pattern)
  if (!isPattern) return new RegExp(`^${escapedPattern}$`)

  return new RegExp(`^${escapedPattern.replaceAll('\\*', '(.*)')}$`)
}

/**
 * Every path an entrypoint resolves to: a string, each item of a list, and each condition an object nests. A `*` in a
 * target stands for any text only under a key that holds a `*`, as Node reads it. The walk keeps its own list of what
 * is left to read, so a manifest nested at any depth does not overflow the stack.
 *
 * @param exportsValue - The `exports` of a manifest.
 * @returns The targets.
 */
const listTargets = (exportsValue: unknown): ExportTarget[] => {
  const targets: ExportTarget[] = []
  const pending: [unknown, string][] = [[exportsValue, '.']]
  for (let entry = pending.pop(); entry; entry = pending.pop()) {
    const [value, key] = entry
    if (typeof value === 'string') targets.push({ target: value, isPattern: key.includes('*') })
    if (value && typeof value === 'object')
      for (const [name, nested] of Object.entries(value)) pending.push([nested, readSubpathKey(name, key)])
  }

  return targets
}

/**
 * Reads the subpath key a nested value sits under: the name itself when it is a subpath such as `./users`, or else the
 * key above it, since a condition such as `import`, or a position in a list, names no subpath.
 *
 * @param name - The name the value sits under.
 * @param key - The subpath key above the name.
 * @returns The subpath key.
 */
const readSubpathKey = (name: string, key: string): string => {
  if (name.startsWith('.')) return name

  return key
}

/**
 * Reads what a manifest carries under `exports`, past a byte order mark.
 *
 * @param manifest - The absolute path of `package.json`.
 * @returns The value, and nothing for a manifest that does not parse.
 */
const readExports = (manifest: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(manifest, 'utf8').replace(BYTE_ORDER_MARK_REG_EXP, ''))

    return readField(parsed, 'exports')
  } catch {
    return undefined
  }
}
