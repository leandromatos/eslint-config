import { readFileSync } from 'fs'

export const read = (path: string): string => readFileSync(path, 'utf8')
