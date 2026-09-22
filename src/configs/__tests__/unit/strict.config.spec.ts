import { describe, expect, it } from 'vitest'

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

  it('keeps the cycle walk inside the project, which is the only graph it can act on', () => {
    const [cycles] = strict().filter(entry => entry.rules?.['import-x/no-cycle'])
    const [, options] = cycles?.rules?.['import-x/no-cycle'] as [string, { ignoreExternal: boolean }]

    expect(options.ignoreExternal).toBe(true)
  })

  it('hands the default vocabulary out whole, so a project extends it rather than restating it', () => {
    const suffixToFolder = { ...DEFAULT_ARCHITECTURE.suffixToFolder, widget: 'widgets' }
    const entries = strict({ architecture: { ...DEFAULT_ARCHITECTURE, suffixToFolder } })
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')
    const [, options] = ownEntry?.rules?.['leandromatos/architecture-known-suffix'] as [
      string,
      { suffixToFolder: object },
    ]

    expect(options.suffixToFolder).toMatchObject({ widget: 'widgets', service: 'services' })
  })

  it('judges the files the project names', () => {
    const [ownEntry] = strict({ files: ['lib/**/*.ts'] }).filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual(['lib/**/*.ts'])
  })

  it('turns the documentation rules on, which this package does not carry itself', () => {
    const [documentation] = strict().filter(entry => entry.rules?.['jsdoc/require-param'])

    expect(documentation?.rules?.['jsdoc/require-returns']).toBe('error')
  })

  it('reaches the configuration files with the comment rule, which reads no type', () => {
    const [notes] = strict().filter(entry => entry.files?.includes('*.mts'))

    expect(notes?.rules?.['leandromatos/tsdoc-comment-form']).toBeDefined()
  })
})
