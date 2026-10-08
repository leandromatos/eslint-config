import { describe, expect, it } from 'vitest'

import { ruleOptionsOf } from '../../../__tests__/utils/index.js'
import { DEFAULT_ARCHITECTURE } from '../../constants/index.js'
import { strict } from '../../strict.config.js'

describe('strict', () => {
  it('opens with the shared configuration and closes with the rules of this package', () => {
    const entries = strict()
    const names = entries.map(entry => entry.name).filter(Boolean)

    expect(names).toEqual(expect.arrayContaining(['leandromatos/recommended']))
  })

  it('ignores what a tool wrote, plus what the project adds', () => {
    const entries = strict({ ignores: ['agents'] })
    const ignoring = entries.find(entry => entry.ignores && !entry.files)

    expect(ignoring?.ignores).toEqual(['**/.claude', '**/coverage', '**/dist', 'agents'])
  })

  it('turns the import boundaries on, which is where a layer says what it exposes', () => {
    const entries = strict({ architecture: { suffixToFolder: { service: 'services' } } })
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.rules?.['leandromatos/architecture-import-boundaries']).toBeDefined()
  })

  it('refuses a cycle everywhere but in a barrel, which re-exports its siblings by design', () => {
    const [cycles] = strict().filter(entry => entry.rules?.['import-x/no-cycle'])

    expect(cycles?.ignores).toEqual(['**/index.{ts,tsx}'])
  })

  it('admits no cast in the sources, specs included, and leaves as const alone', () => {
    const entry = strict().find(configEntry => configEntry.name === 'leandromatos/casts')

    expect(entry?.files).toEqual(['src/**/*.ts', '{apps,libs,packages}/*/src/**/*.ts'])
    expect(entry?.ignores).toBeUndefined()
    expect(entry?.rules).toEqual({
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-non-null-assertion': 'error',
    })
  })

  it('lets no value typed any travel through the sources, outside a spec', () => {
    const entry = strict().find(configEntry => configEntry.name === 'leandromatos/unsafe-values')

    expect(entry?.ignores).toEqual(['**/*.spec.{ts,tsx}'])
    expect(Object.values(entry?.rules ?? {})).toEqual(['error', 'error', 'error', 'error', 'error'])
  })

  it('asks every directive that turns a rule off for its reason', () => {
    const entry = strict({ files: ['lib/**/*.ts'] }).find(configEntry => configEntry.name === 'leandromatos/directives')

    expect(entry?.files).toEqual(['lib/**/*.ts'])
    expect(entry?.rules).toEqual({ '@eslint-community/eslint-comments/require-description': 'error' })
  })

  it('keeps the cycle walk inside the project, which is the only graph it can act on', () => {
    const [cycles] = strict().filter(entry => entry.rules?.['import-x/no-cycle'])
    const options = ruleOptionsOf(cycles, 'import-x/no-cycle')

    expect(options).toHaveProperty('ignoreExternal', true)
  })

  it('hands the default vocabulary out whole, so a project extends it rather than restating it', () => {
    const suffixToFolder = { ...DEFAULT_ARCHITECTURE.suffixToFolder, widget: 'widgets' }
    const suffixDictionary = { widget: 'widgets' }
    const entries = strict({ architecture: { ...DEFAULT_ARCHITECTURE, suffixToFolder, suffixDictionary } })
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')
    const options = ruleOptionsOf(ownEntry, 'leandromatos/architecture-known-suffix')

    expect(options['suffixToFolder']).toMatchObject({ widget: 'widgets', service: 'services' })
  })

  it('judges the sources of the repository and of each package of a workspace folder, by default', () => {
    const [ownEntry] = strict().filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual(['src/**/*.ts', '{apps,libs,packages}/*/src/**/*.ts'])
  })

  it('judges the files the project names', () => {
    const [ownEntry] = strict({ files: ['lib/**/*.ts'] }).filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual(['lib/**/*.ts'])
  })

  it('checks the grammar of a comment with the TSDoc parser, which this package does not carry itself', () => {
    const [documentation] = strict().filter(entry => entry.rules?.['tsdoc/syntax'])

    expect(documentation?.rules?.['tsdoc/syntax']).toBe('error')
  })

  it('reads no release tag until the project says a tool reads them', () => {
    const [ownEntry] = strict().filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.rules?.['leandromatos/tsdoc-unread-tag']).toEqual([
      'error',
      expect.objectContaining({ readsReleaseTags: false }),
    ])
  })

  it('reaches the configuration files with the comment rule, which reads no type', () => {
    const [notes] = strict().filter(entry => entry.files?.includes('*.mts'))

    expect(notes?.rules?.['leandromatos/tsdoc-comment-form']).toBeDefined()
  })
})
