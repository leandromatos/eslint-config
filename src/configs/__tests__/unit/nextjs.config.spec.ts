import { describe, expect, it } from 'vitest'

import type { ArchitectureOptions } from '../../../plugins/architecture/types/index.js'
import { NEXTJS_ARCHITECTURE } from '../../constants/index.js'
import { nextjs } from '../../nextjs.config.js'

describe('nextjs', () => {
  const architectureOf = (entries: ReturnType<typeof nextjs>): ArchitectureOptions => {
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')
    const [, architectureOptions] = ownEntry?.rules?.['leandromatos/architecture-known-suffix'] as [
      string,
      ArchitectureOptions,
    ]

    return architectureOptions
  }

  it('carries all of strict, which is what the tier is built on', () => {
    const names = nextjs()
      .map(entry => entry.name)
      .filter(Boolean)

    expect(names).toEqual(expect.arrayContaining(['leandromatos/recommended']))
  })

  it('reads the tree a React project writes', () => {
    const architectureOptions = architectureOf(nextjs())

    expect(architectureOptions.moduleContainers).toEqual(NEXTJS_ARCHITECTURE.moduleContainers)
    expect(architectureOptions.suffixFreeFolders).toEqual(NEXTJS_ARCHITECTURE.suffixFreeFolders)
    expect(architectureOptions.coLocatedTypeSuffixes).toEqual(NEXTJS_ARCHITECTURE.coLocatedTypeSuffixes)
  })

  it('judges the components as well as the modules, which is what a React project holds', () => {
    const [ownEntry] = nextjs().filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual(['src/**/*.{ts,tsx}'])
  })

  it('lets a project differ from the tier, group by group', () => {
    const suffixToFolder = { ...NEXTJS_ARCHITECTURE.suffixToFolder, widget: 'widgets' }
    const suffixDictionary = { widget: 'widgets' }
    const architectureOptions = architectureOf(
      nextjs({ architecture: { ...NEXTJS_ARCHITECTURE, suffixToFolder, suffixDictionary } }),
    )

    expect(architectureOptions.suffixToFolder).toMatchObject({ widget: 'widgets', screen: 'screens' })
  })

  it('judges the files the project names', () => {
    const [ownEntry] = nextjs({ files: ['app/**/*.tsx'] }).filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual(['app/**/*.tsx'])
  })

  it('keeps the catalogue out of the application, and leaves the catalogue itself alone', () => {
    const entry = nextjs()
      .filter(configEntry => configEntry.rules?.['no-restricted-imports'])
      .at(-1)
    const [, restriction] = entry?.rules?.['no-restricted-imports'] as [string, { patterns: { group: string[] }[] }]

    expect(entry?.ignores).toEqual(['src/storybook/**/*.{ts,tsx}', 'src/**/*.stories.tsx'])
    expect(restriction.patterns.map(pattern => pattern.group)).toEqual([
      ['@/storybook', '@/storybook/*'],
      ['*.stories', '*.stories.tsx'],
    ])
  })

  it('ignores what the framework, the catalogue and a browser run wrote, plus what the project adds', () => {
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
})
