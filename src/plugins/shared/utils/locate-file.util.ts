import path from 'node:path'

import type { TSESLint } from '@typescript-eslint/utils'

import type { Location } from '../types/index.js'

/** The directory a package keeps its sources in. */
const SOURCE_DIRECTORY = 'src'

/** A file name that carries a suffix before its extension: `user.service.ts`, whose stem is `user`. */
const SUFFIXED_FILE_REG_EXP = /^(?<stem>.+)\.(?<suffix>[^.]+)\.[^.]+$/

/**
 * Where the file sits relative to its source root, which is what every rule that reads a location judges.
 *
 * The source root is the outermost `src` directory between the working directory and the file, so `apps/x/src` and
 * `libs/x/src` each root their own package, and a module named `src` inside the sources stays a module.
 *
 * @param context - What the rule knows of the run: the working directory, and the file being linted.
 * @returns The location, and null for a file outside the working directory or with no `src` in its path.
 */
export const locateFile = (
  context: Pick<TSESLint.RuleContext<string, unknown[]>, 'cwd' | 'filename'>,
): Location | null => {
  const relative = path.relative(context.cwd, path.resolve(context.cwd, context.filename))
  if (relative.startsWith('..')) return null
  const directories = relative.split(path.sep).slice(0, -1)
  const at = directories.indexOf(SOURCE_DIRECTORY)
  if (at < 0) return null
  const file = path.basename(relative)
  const packageRoot = path.join(context.cwd, ...directories.slice(0, at))
  const sourceRoot = path.join(packageRoot, SOURCE_DIRECTORY)
  const segments = directories.slice(at + 1)
  const module = segments[0] ?? ''
  const groups = SUFFIXED_FILE_REG_EXP.exec(file)?.groups
  const suffix = groups?.suffix ?? null
  const stem = groups?.stem ?? file.replace(/\..*$/, '')

  return { packageRoot, sourceRoot, file, segments, module, suffix, stem }
}
