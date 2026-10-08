import { describe, expect, it } from 'vitest'

import { ruleOptionsOf } from '../../../__tests__/utils/index.js'
import { NEXTJS_ARCHITECTURE } from '../../constants/index.js'
import { nextjs } from '../../nextjs.config.js'

describe('nextjs', () => {
  const architectureOf = (entries: ReturnType<typeof nextjs>): Record<string, unknown> => {
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')

    return ruleOptionsOf(ownEntry, 'leandromatos/architecture-known-suffix')
  }

  it('adds the suffixes a project names to the map of the tier, rather than replacing it', () => {
    const { suffixToFolder } = architectureOf(nextjs({ architecture: { suffixToFolder: { exception: 'exceptions' } } }))

    expect(suffixToFolder).toHaveProperty('exception', 'exceptions')
    expect(suffixToFolder).toHaveProperty('hook', 'hooks')
  })

  it('carries all of strict, which is what the tier is built on', () => {
    const names = nextjs()
      .map(entry => entry.name)
      .filter(Boolean)

    expect(names).toEqual(expect.arrayContaining(['leandromatos/recommended']))
  })

  it('reads the tree a React project writes', () => {
    const architectureOptions = architectureOf(nextjs())

    expect(architectureOptions['moduleContainers']).toEqual(NEXTJS_ARCHITECTURE.moduleContainers)
    expect(architectureOptions['suffixFreeFolders']).toEqual(NEXTJS_ARCHITECTURE.suffixFreeFolders)
    expect(architectureOptions['coLocatedTypeSuffixes']).toEqual(NEXTJS_ARCHITECTURE.coLocatedTypeSuffixes)
  })

  it('judges the components as well as the modules, which is what a React project holds', () => {
    const [ownEntry] = nextjs().filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual(['src/**/*.{ts,tsx}', '{apps,libs,packages}/*/src/**/*.{ts,tsx}'])
  })

  it('lets a project differ from the tier, group by group', () => {
    const suffixToFolder = { ...NEXTJS_ARCHITECTURE.suffixToFolder, widget: 'widgets' }
    const suffixDictionary = { widget: 'widgets' }
    const architectureOptions = architectureOf(
      nextjs({ architecture: { ...NEXTJS_ARCHITECTURE, suffixToFolder, suffixDictionary } }),
    )

    expect(architectureOptions['suffixToFolder']).toMatchObject({ widget: 'widgets', screen: 'screens' })
  })

  it('judges the files the project names', () => {
    const [ownEntry] = nextjs({ files: ['app/**/*.tsx'] }).filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual(['app/**/*.tsx'])
  })

  it('keeps the catalog out of the application, and leaves the catalog itself alone', () => {
    const entry = nextjs()
      .filter(configEntry => configEntry.rules?.['no-restricted-imports'])
      .at(-1)
    const restriction = ruleOptionsOf(entry, 'no-restricted-imports')

    expect(entry?.ignores).toEqual([
      'src/storybook/**/*.{ts,tsx}',
      'src/**/*.stories.tsx',
      '{apps,libs,packages}/*/src/storybook/**/*.{ts,tsx}',
      '{apps,libs,packages}/*/src/**/*.stories.tsx',
    ])
    expect(restriction['patterns']).toEqual([
      expect.objectContaining({ group: ['@/storybook', '@/storybook/*'] }),
      expect.objectContaining({ group: ['*.stories', '*.stories.tsx'] }),
    ])
  })

  it('ignores what the framework, the catalog and a browser run wrote, plus what the project adds', () => {
    const entries = nextjs({ ignores: ['src/components/ui'] })
    const ignoring = entries.find(entry => entry.ignores && !entry.files && !entry.rules)

    expect(ignoring?.ignores).toEqual([
      '**/.claude',
      '**/coverage',
      '**/dist',
      '**/.next',
      '**/lighthouse-report',
      '**/next-env.d.ts',
      '**/playwright-report',
      '**/public',
      '**/storybook-static',
      '**/test-results',
      'src/components/ui',
    ])
  })

  it('asks a component for its props and its markup, as every other function', () => {
    const componentEntries = nextjs().filter(
      entry => entry.files?.includes('**/*.tsx') && entry.rules?.['leandromatos/tsdoc-param-tag'],
    )

    expect(componentEntries).toEqual([])
  })
})
