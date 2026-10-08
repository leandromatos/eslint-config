import fs from 'node:fs'

/**
 * Whether a directory holds a responsibility of its own: a layer, or a mirror of one.
 *
 * @param directory - The absolute path of the directory.
 * @param folders - The directory names that hold a responsibility: the layers and the mirrors.
 * @returns Whether one of them sits directly inside it.
 */
export const carriesResponsibilities = (directory: string, folders: string[]): boolean =>
  fs.readdirSync(directory, { withFileTypes: true }).some(entry => entry.isDirectory() && folders.includes(entry.name))
