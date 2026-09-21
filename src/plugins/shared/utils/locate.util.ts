import path from 'node:path'

import type { TSESLint } from '@typescript-eslint/utils'

import type { Location } from '../types/index.js'

/**
 * Where the file sits relative to `src/`, which is what every rule that reads a location judges.
 *
 * @param context - What the rule knows of the run: the working directory, and the file being linted.
 * @returns The location, and null for a file outside `src/`.
 */
export const locate = (context: Pick<TSESLint.RuleContext<string, unknown[]>, 'cwd' | 'filename'>): Location | null => {
  const source = path.join(context.cwd, 'src')
  const relative = path.relative(source, path.resolve(context.cwd, context.filename))
  if (relative.startsWith('..')) return null
  const segments = relative.split(path.sep)
  /* v8 ignore next -- a path relative to the source root always names a file */
  const file = segments.pop() ?? ''
  const parts = file.split('.')
  const hasSuffix = parts.length > 2
  const module = segments[0] ?? ''
  const suffix = readSuffix(parts, hasSuffix)
  const stem = readStem(parts, hasSuffix)

  return { file, segments, module, suffix, stem }
}

/**
 * The suffix a file name carries: `service` for `user.service.ts`.
 *
 * @param parts - The file name, split on its dots.
 * @param hasSuffix - Whether the name carries one at all.
 * @returns The suffix, and null for a file named without one.
 */
const readSuffix = (parts: string[], hasSuffix: boolean): string | null => {
  if (!hasSuffix) return null

  /* v8 ignore next -- the caller asked because the name carries a suffix, so the part before it is there */
  return parts[parts.length - 2] ?? null
}

/**
 * The name before the suffix: `user` for `user.service.ts`, `main` for `main.ts`.
 *
 * @param parts - The file name, split on its dots.
 * @param hasSuffix - Whether the name carries a suffix at all.
 * @returns The stem.
 */
const readStem = (parts: string[], hasSuffix: boolean): string => {
  /* v8 ignore next -- a file name split on its dots always has a first part */
  if (!hasSuffix) return parts[0] ?? ''

  return parts.slice(0, -2).join('.')
}
