import fs from 'node:fs'
import path from 'node:path'

/**
 * Whether a file is the root file of the context it sits in.
 *
 * A context is a directory that carries responsibilities of its own: its schemas, its types, its tests. The file
 * named after it is what the context is, so it sits at the root rather than in the folder of its suffix, the way
 * `users.module.ts` sits at the root of `users/`.
 *
 * Both halves are needed. The name alone would take `particle-object.constant.ts` out of `constants/` for sitting
 * in a directory of the same name, and the responsibilities alone say nothing about which file is the root one.
 *
 * @param cwd - The directory the run was started from, which holds `src/`.
 * @param segments - Where the file sits under `src/`, as directory names.
 * @param stem - The file name before its suffix.
 * @param folders - The directory names that hold a responsibility: the layers and the mirrors.
 * @returns Whether the file names the context it sits in, and that context carries responsibilities.
 */
export const isContextRoot = (cwd: string, segments: string[], stem: string, folders: string[]): boolean => {
  const directory = segments[segments.length - 1]
  if (!directory || directory !== stem) return false

  return fs
    .readdirSync(path.join(cwd, 'src', ...segments), { withFileTypes: true })
    .some(entry => entry.isDirectory() && folders.includes(entry.name))
}
