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

  it('mirrors a source only in a kind it knows, so a mirroring kind cannot name a folder no rule accepts', () => {
    const known = new Set(DEFAULT_ARCHITECTURE.testKinds)

    expect(DEFAULT_ARCHITECTURE.mirroringTestKinds.filter(kind => !known.has(kind))).toEqual([])
  })

  it('mirrors the kinds that exercise one source file, and no kind that asserts a property of the whole', () => {
    expect(DEFAULT_ARCHITECTURE.mirroringTestKinds).toEqual(['unit', 'integration'])
    expect(DEFAULT_TESTING.testKinds).toEqual(DEFAULT_ARCHITECTURE.testKinds)
    expect(DEFAULT_TESTING.mirroringTestKinds).toEqual(DEFAULT_ARCHITECTURE.mirroringTestKinds)
  })

  it('holds the folder the specs live in, which every plugin that treats a spec apart reads', () => {
    expect(SUFFIX_TO_FOLDER.spec).toBe('__tests__')
    expect(DEFAULT_ARCHITECTURE.testFolder).toBe(SUFFIX_TO_FOLDER.spec)
  })
})
