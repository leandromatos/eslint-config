import { TSESLint } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { readArchitectureOptions, readRuleOptions } from '../../../__tests__/utils/index.js'
import { countModuleDepth } from '../../../plugins/shared/utils/index.js'
import { NEXTJS_ARCHITECTURE, NEXTJS_FILES } from '../../constants/index.js'
import { nextjs } from '../../nextjs.config.js'
import { strict } from '../../strict.config.js'

describe('nextjs', () => {
  it('adds the suffixes a project names to the map of the tier, rather than replacing it', () => {
    const { suffixToFolder } = readArchitectureOptions(
      nextjs({ architecture: { suffixToFolder: { exception: 'exceptions' } } }),
    )

    expect(suffixToFolder).toHaveProperty('exception', 'exceptions')
    expect(suffixToFolder).toHaveProperty('hook', 'hooks')
  })

  it('opens with every entry of strict, in the order strict writes them', () => {
    const expectedStrictNames = strict().map(entry => entry.name)

    expect(
      nextjs()
        .map(entry => entry.name)
        .slice(0, expectedStrictNames.length),
    ).toEqual(expectedStrictNames)
  })

  it('reads the tree a React project writes', () => {
    const architectureOptions = readArchitectureOptions(nextjs())

    expect(architectureOptions['moduleContainers']).toEqual(NEXTJS_ARCHITECTURE.moduleContainers)
    expect(architectureOptions['suffixFreeFolders']).toEqual(NEXTJS_ARCHITECTURE.suffixFreeFolders)
    expect(architectureOptions['coLocatedTypeSuffixes']).toEqual(NEXTJS_ARCHITECTURE.coLocatedTypeSuffixes)
  })

  it('reads each script under src/scripts as a context with layers of its own', () => {
    const { moduleContainers } = readArchitectureOptions(nextjs())

    expect(moduleContainers).toEqual(NEXTJS_ARCHITECTURE.moduleContainers)
    expect(countModuleDepth(['scripts', 'shadcn-to-storybook', 'utils'], NEXTJS_ARCHITECTURE.moduleContainers)).toBe(2)
  })

  it('judges the components as well as the modules, which is what a React project holds', () => {
    const [ownEntry] = nextjs().filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.files).toEqual([
      'src/**/*.{ts,tsx}',
      '{apps,libs,packages}/*/src/**/*.{ts,tsx}',
      'scripts/**/*.{ts,mts,tsx}',
    ])
  })

  it('lets a project differ from the tier, group by group', () => {
    const suffixToFolder = { ...NEXTJS_ARCHITECTURE.suffixToFolder, widget: 'widgets' }
    const suffixDictionary = { widget: 'widgets' }
    const architectureOptions = readArchitectureOptions(
      nextjs({ architecture: { ...NEXTJS_ARCHITECTURE, suffixToFolder, suffixDictionary } }),
    )

    expect(architectureOptions['suffixToFolder']).toMatchObject({ widget: 'widgets', screen: 'screens' })
  })

  it('judges the files the project adds beside the ones of the tier', () => {
    const [ownEntry] = nextjs({ files: ['app/**/*.tsx'] }).filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.files).toEqual([...NEXTJS_FILES, 'app/**/*.tsx'])
  })

  it('judges only the files a function answers, when the project replaces the list', () => {
    const [ownEntry] = nextjs({ files: () => ['app/**/*.tsx'] }).filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.files).toEqual(['app/**/*.tsx'])
  })

  it('keeps the catalog out of the application, and leaves the catalog itself alone', () => {
    const entry = nextjs()
      .filter(configEntry => configEntry.rules?.['no-restricted-imports'])
      .at(-1)
    const restriction = readRuleOptions(entry, 'no-restricted-imports')

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

  it('asks the Image component for its alternative text, as an img', () => {
    const entry = nextjs().find(configEntry => configEntry.name === 'leandromatos/image-alt-text')

    expect(entry?.rules?.['jsx-a11y/alt-text']).toEqual(['warn', { elements: ['img'], img: ['Image'] }])
  })

  it('reads the image rule in a file outside JSX as well, whose plugin the entry names', async () => {
    const eslint = new TSESLint.ESLint({ cwd: '/repository', overrideConfigFile: true, baseConfig: nextjs() })

    const config: unknown = await eslint.calculateConfigForFile('/repository/src/utils/date.util.ts')

    expect(config).toHaveProperty(['rules', 'jsx-a11y/alt-text', 0], 1)
  })

  it('restricts no import for a project that keeps no catalog', () => {
    expect(nextjs({ catalog: false }).map(entry => entry.name)).not.toContain('leandromatos/nextjs-catalog')
  })

  it('ignores what the framework, the catalog and a browser run wrote, plus what the project adds', () => {
    const entries = nextjs({ ignores: ['src/components/ui'] })
    const ignoring = entries.find(entry => entry.ignores && !entry.files && !entry.rules)

    expect(ignoring?.ignores).toEqual([
      '**/coverage',
      '**/dist',
      '**/.next',
      '**/next-env.d.ts',
      '**/playwright-report',
      '**/public',
      '**/storybook-static',
      '**/test-results',
      'src/components/ui',
    ])
  })

  it('sets no tsdoc entry of its own for a component, so a component is documented as every other function', () => {
    const componentEntries = nextjs().filter(
      entry => entry.files?.includes('**/*.tsx') && entry.rules?.['leandromatos/tsdoc-param-tag'],
    )

    expect(componentEntries).toEqual([])
  })

  it('keeps the catalog out of the application of a package, over the files the tier judges there', () => {
    const entry = nextjs({ basePath: 'packages/web', files: () => ['src/**/*.tsx'] })
      .filter(configEntry => configEntry.rules?.['no-restricted-imports'])
      .at(-1)

    expect(entry?.basePath).toBe('packages/web')
    expect(entry?.files).toEqual(['src/**/*.tsx'])
  })
})
