import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ARCHITECTURE,
  DEFAULT_NAMING,
  DEFAULT_TESTING,
  DEFAULT_TSDOC,
  SUFFIX_TO_FOLDER,
} from '../../../constants/index.js'

describe('SUFFIX_TO_FOLDER', () => {
  it('is the one place a folder name is written, so every default that names one agrees with it', () => {
    const folders = new Set<string>(Object.values(SUFFIX_TO_FOLDER))
    const named = [
      ...DEFAULT_ARCHITECTURE.mirrorFolders,
      ...Object.keys(DEFAULT_ARCHITECTURE.typeSuffixes),
      DEFAULT_ARCHITECTURE.testFolder,
      DEFAULT_TESTING.testFolder,
      DEFAULT_TSDOC.testFolder,
      DEFAULT_NAMING.testFolder,
    ]

    expect(named.filter(folder => !folders.has(folder))).toEqual([])
  })

  it('names the layers the suffix lists point at, so a lost suffix cannot turn a rule off quietly', () => {
    const suffixes = new Set<string>(Object.keys(SUFFIX_TO_FOLDER))
    const named = [...DEFAULT_ARCHITECTURE.orderedSuffixes, ...DEFAULT_NAMING.resourceSuffixes]

    expect(named.filter(suffix => !suffixes.has(suffix))).toEqual([])
  })

  it('holds the folder the specs live in, which every plugin that treats a spec apart reads', () => {
    expect(SUFFIX_TO_FOLDER.spec).toBe('__tests__')
    expect(DEFAULT_ARCHITECTURE.testFolder).toBe(SUFFIX_TO_FOLDER.spec)
  })
})
