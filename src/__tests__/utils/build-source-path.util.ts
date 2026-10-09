import path from 'node:path'

/**
 * The path of a file under the `src/` of the working directory, the source root of a repository with one package. It
 * is relative, so it lands under whichever directory the tester runs in, and the file exists only for the rules that
 * read the directory around it.
 *
 * @param segments - The path under `src/`, one segment per directory, the file last.
 * @returns The path.
 */
export const buildSourcePath = (...segments: string[]): string => path.join('src', ...segments)
