import { describe, expect, it } from 'vitest'

import {
  AGNOSTIC_SUFFIX_DICTIONARY,
  NESTJS_SUFFIX_DICTIONARY,
  REACT_SUFFIX_DICTIONARY,
  SUFFIX_DICTIONARY,
} from '../../../constants/index.js'

const LAYERS = [AGNOSTIC_SUFFIX_DICTIONARY, NESTJS_SUFFIX_DICTIONARY, REACT_SUFFIX_DICTIONARY]

describe('SUFFIX_DICTIONARY', () => {
  it('holds every suffix of every layer', () => {
    const suffixes = LAYERS.flatMap(layer => Object.keys(layer))

    expect(Object.keys(SUFFIX_DICTIONARY).sort()).toEqual([...new Set(suffixes)].sort())
  })

  it('puts a suffix two layers share in the same folder, so the union picks no side', () => {
    const disagreements = LAYERS.flatMap(layer =>
      Object.entries(layer).filter(([suffix, folder]) => Reflect.get(SUFFIX_DICTIONARY, suffix) !== folder),
    )

    expect(disagreements).toEqual([])
  })

  it('names the design patterns of the catalog by their participant', () => {
    expect(AGNOSTIC_SUFFIX_DICTIONARY).toMatchObject({
      adapter: 'adapters',
      strategy: 'strategies',
      visitor: 'visitors',
    })
  })

  it('keeps the specs in __tests__, the name the ecosystem uses', () => {
    expect(AGNOSTIC_SUFFIX_DICTIONARY.spec).toBe('__tests__')
  })
})
