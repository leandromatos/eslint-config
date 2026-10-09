import path from 'node:path'

/**
 * The path of a file under the `src/` of a package inside the working directory, the way a monorepo or a serverless
 * repository lays its sources out: `apps/x/src/...`, `libs/x/src/...`, `packages/x/src/...`.
 *
 * @param packageDirectory - Where the package sits under the working directory, such as `apps/x`.
 * @param segments - The path under the package's `src/`, one segment per directory, the file last.
 * @returns The path, relative, so it lands under whichever directory the tester runs in.
 */
export const buildPackageSourcePath = (packageDirectory: string, ...segments: string[]): string =>
  path.join(packageDirectory, 'src', ...segments)
