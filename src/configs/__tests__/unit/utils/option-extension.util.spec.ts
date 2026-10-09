import { describe, expect, it } from 'vitest'

import type { TypescriptOptions } from '../../../../plugins/typescript/types/index.js'
import { DEFAULT_ARCHITECTURE, DEFAULT_NAMING, DEFAULT_TSDOC, DEFAULT_VOCABULARY } from '../../../constants/index.js'
import {
  applyPreset,
  extendArchitecture,
  extendList,
  extendMap,
  extendNaming,
  extendText,
  extendTsdoc,
  extendTypescript,
} from '../../../utils/index.js'

describe('extendList', () => {
  it('answers the default when the project passes nothing', () => {
    const expectedDefaults = ['unit']

    expect(extendList(expectedDefaults, undefined)).toBe(expectedDefaults)
  })

  it('adds what an array carries after the default, each item once', () => {
    expect(extendList(['unit', 'e2e'], ['e2e', 'smoke'])).toEqual(['unit', 'e2e', 'smoke'])
  })

  it('answers what a function makes of a copy of the default, which it may change freely', () => {
    const defaults = ['unit', 'e2e']

    expect(extendList(defaults, list => list.filter(kind => kind !== 'e2e'))).toEqual(['unit'])
    expect(extendList(defaults, list => list.splice(0))).toEqual(['unit', 'e2e'])
    expect(defaults).toEqual(['unit', 'e2e'])
  })
})

describe('extendMap', () => {
  it('answers the default when the project passes nothing', () => {
    const expectedDefaults: Record<string, string> = { spec: '__tests__' }

    expect(extendMap(expectedDefaults, undefined)).toBe(expectedDefaults)
  })

  it('adds the entries an object carries, and replaces a key the default holds', () => {
    expect(extendMap({ spec: '__tests__', type: 'types' }, { spec: 'tests', widget: 'widgets' })).toEqual({
      spec: 'tests',
      type: 'types',
      widget: 'widgets',
    })
  })

  it('answers what a function makes of a copy of the default', () => {
    const defaults: Record<string, string> = { build: 'built', hash: 'hashed' }

    expect(
      extendMap(defaults, map => Object.fromEntries(Object.entries(map).filter(([verb]) => verb !== 'hash'))),
    ).toEqual({ build: 'built' })
    expect(defaults).toEqual({ build: 'built', hash: 'hashed' })
  })
})

describe('extendArchitecture', () => {
  it('answers the vocabulary of the tier when the project says nothing', () => {
    expect(extendArchitecture(DEFAULT_ARCHITECTURE)).toEqual(DEFAULT_ARCHITECTURE)
  })

  it('replaces a scalar and joins a list', () => {
    const architectureOptions = extendArchitecture(DEFAULT_ARCHITECTURE, {
      alias: '~',
      testFolder: 'tests',
      rootContexts: ['configs'],
    })

    expect(architectureOptions).toMatchObject({ alias: '~', testFolder: 'tests', rootContexts: ['configs'] })
  })
})

describe('extendNaming', () => {
  it('answers the vocabulary of the tier when the project says nothing', () => {
    expect(extendNaming(DEFAULT_NAMING)).toEqual(DEFAULT_NAMING)
  })

  it('joins what a project forbids to what the tier forbids', () => {
    const forbiddenWord = { word: 'data', because: 'it names no content' }

    expect(extendNaming(DEFAULT_NAMING, { forbiddenWords: [forbiddenWord] }).forbiddenWords).toEqual([forbiddenWord])
  })
})

describe('applyPreset', () => {
  it('extends each group of the tier the preset names, and leaves the others', () => {
    const vocabulary = applyPreset(DEFAULT_VOCABULARY, {
      naming: { resourceFreeStems: ['auth'] },
      testing: { httpTest: { kind: 'e2e', client: 'supertest' } },
      tsdoc: { commentWidth: 120 },
    })

    expect(vocabulary.naming.resourceFreeStems).toEqual(['auth'])
    expect(vocabulary.testing.httpTest).toEqual({ kind: 'e2e', client: 'supertest' })
    expect(vocabulary.tsdoc.commentWidth).toBe(120)
    expect(vocabulary.architecture).toEqual(DEFAULT_VOCABULARY.architecture)
    expect(vocabulary.files).toBe(DEFAULT_VOCABULARY.files)
  })
})

describe('extendText', () => {
  it('joins the patterns of the project to the tier', () => {
    const stringPattern = { callee: 'log', must: '^[A-Z]', because: 'a log opens on a capital' }

    expect(extendText({ stringPatterns: [] }, { stringPatterns: [stringPattern] })).toEqual({
      stringPatterns: [stringPattern],
    })
  })
})

describe('extendTsdoc', () => {
  it('replaces the width and joins the conditions', () => {
    const throwsCondition = { title: '^Error while (.+)\\.$', condition: 'When $1 fails.' }

    expect(extendTsdoc(DEFAULT_TSDOC, { commentWidth: 120, throwsConditions: [throwsCondition] })).toEqual({
      ...DEFAULT_TSDOC,
      commentWidth: 120,
      throwsConditions: [throwsCondition],
    })
  })
})

describe('extendTypescript', () => {
  it('replaces the suffix a type file carries', () => {
    const expectedDefaults: TypescriptOptions = { typeSuffix: 'type' }

    expect(extendTypescript(expectedDefaults, { typeSuffix: 'types' })).toEqual({ typeSuffix: 'types' })
    expect(extendTypescript(expectedDefaults)).toEqual(expectedDefaults)
  })
})
