import { readFile } from 'node:fs/promises'

export const readManifest = async path => {
  const manifest = await readFile(path, 'utf8')

  return JSON.parse(manifest)
}
