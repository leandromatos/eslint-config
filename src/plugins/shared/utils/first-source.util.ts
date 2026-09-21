import fs from 'node:fs'

/**
 * The file a directory is reported on, so a finding about the directory appears once: its
 * barrel when it has one, else its first source file in name order.
 *
 * @param directory - The absolute path of the directory.
 * @returns The file name, and an empty string for a directory holding no source.
 */
export const firstSourceOf = (directory: string): string => {
  const files = fs
    .readdirSync(directory)
    .filter(name => name.endsWith('.ts') && !name.endsWith('.d.ts'))
    .sort()
  if (files.includes('index.ts')) return 'index.ts'

  /* v8 ignore next -- the caller reads a directory that holds a source file, which is what made it ask */
  return files.find(name => name !== 'index.ts') ?? ''
}
