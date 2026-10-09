import { describe, expect, it } from 'vitest'

import { toScreamingCase } from '../../../../plugins/shared/utils/index.js'
import * as constants from '../../../constants/index.js'
import {
  DEFAULT_ARCHITECTURE,
  DEFAULT_NAMING,
  DEFAULT_VOCABULARY,
  EXPO_VOCABULARY,
  NESTJS_VOCABULARY,
  NEXTJS_VOCABULARY,
} from '../../../constants/index.js'

const TIERS = [
  ['strict', DEFAULT_VOCABULARY],
  ['nestjs', NESTJS_VOCABULARY],
  ['nextjs', NEXTJS_VOCABULARY],
  ['expo', EXPO_VOCABULARY],
] as const

/** The prefix the constants of each tier carry, the tiers each one builds on after it. */
const TIER_PREFIXES = [
  ['strict', ['DEFAULT']],
  ['nestjs', ['NESTJS', 'DEFAULT']],
  ['nextjs', ['NEXTJS', 'DEFAULT']],
  ['expo', ['EXPO', 'NEXTJS', 'DEFAULT']],
] as const

/** The groups of a vocabulary that hold fields, each written once as a constant of its own. */
const FIELD_GROUPS = ['architecture', 'naming', 'tsdoc', 'typescript', 'text', 'testing'] as const

describe.each(TIERS)('the vocabulary of %s', (_tier, vocabulary) => {
  const { architecture, naming } = vocabulary
  const folders = new Set<string>(Object.values(architecture.suffixToFolder))
  const suffixes = new Set<string>(Object.keys(architecture.suffixToFolder))

  it('names only folders its map holds, so every default that names one agrees with it', () => {
    const named = [...Object.keys(architecture.typeSuffixes), architecture.testFolder]

    expect(named.filter(folder => !folders.has(folder))).toEqual([])
  })

  it('names only layers its map holds, so a lost suffix cannot turn a rule off quietly', () => {
    const named = [
      ...architecture.orderedSuffixes,
      ...architecture.wholeArguments.map(wholeArgument => wholeArgument.suffix),
      ...naming.resourceSuffixes,
    ]

    expect(named.filter(suffix => !suffixes.has(suffix))).toEqual([])
  })

  it('mirrors a source only in a kind it knows, so a mirroring kind cannot name a folder no rule accepts', () => {
    const known = new Set(architecture.testKinds)

    expect(architecture.mirroringTestKinds.filter(kind => !known.has(kind))).toEqual([])
  })

  it('keeps the specs in the folder its map names for them', () => {
    expect(architecture.testFolder).toBe(architecture.suffixToFolder.spec)
  })
})

describe('DEFAULT_ARCHITECTURE', () => {
  it('mirrors the sources in the folders its map names for types and specs', () => {
    const folders = new Set<string>(Object.values(DEFAULT_ARCHITECTURE.suffixToFolder))

    expect(DEFAULT_ARCHITECTURE.mirrorFolders.filter(folder => !folders.has(folder))).toEqual([])
  })

  it('mirrors the kinds that exercise one source file, and no kind that asserts a property of the whole', () => {
    expect(DEFAULT_ARCHITECTURE.mirroringTestKinds).toEqual(['unit', 'integration'])
  })
})

describe('DEFAULT_NAMING', () => {
  it('leaves the result of a conversion free to name, so to* carries no participle', () => {
    expect(DEFAULT_NAMING.verbParticiples).not.toHaveProperty('to')
  })

  it('forbids no name and no word, which a project or the preset decides', () => {
    expect(DEFAULT_NAMING.forbiddenNames).toEqual([])
    expect(DEFAULT_NAMING.forbiddenWords).toEqual([])
  })
})

describe.each(TIER_PREFIXES)('the constants of %s', (tier, prefixes) => {
  const [, vocabulary] = TIERS.find(([name]) => name === tier) ?? TIERS[0]
  const fields = FIELD_GROUPS.flatMap(group => Object.entries(vocabulary[group]))

  it.each(fields)('carry %s as an exported constant of its own, so a project extends it by name', (field, value) => {
    const names = prefixes.map(prefix => `${prefix}_${toScreamingCase(field)}`)
    const carriers = names.filter(name => Reflect.get(constants, name) === value)

    expect(carriers).not.toEqual([])
  })
})
