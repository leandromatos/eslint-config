import { TSESLint } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { readArchitectureOptions, readRuleOptions } from '../../../__tests__/utils/index.js'
import { plugin } from '../../../plugins/index.js'
import { countModuleDepth } from '../../../plugins/shared/utils/index.js'
import { EXPO_ARCHITECTURE, LAYOUT_RULES } from '../../constants/index.js'
import { expo } from '../../expo.config.js'
import { strict } from '../../strict.config.js'

describe('expo', () => {
  it('adds the suffixes a project names to the map of the tier, rather than replacing it', () => {
    const { suffixToFolder } = readArchitectureOptions(
      expo({ architecture: { suffixToFolder: { exception: 'exceptions' } } }),
    )

    expect(suffixToFolder).toHaveProperty('exception', 'exceptions')
    expect(suffixToFolder).toHaveProperty('storage', 'storages')
  })

  it('opens with every entry of strict, in the order strict writes them', () => {
    const expectedStrictNames = strict().map(entry => entry.name)

    expect(
      expo()
        .map(entry => entry.name)
        .slice(0, expectedStrictNames.length),
    ).toEqual(expectedStrictNames)
  })

  it('names the store the device keeps, which the web reaches through a cookie instead', () => {
    const { suffixToFolder } = readArchitectureOptions(expo())

    expect(suffixToFolder).toHaveProperty('storage', 'storages')
  })

  it('leaves the story out: React Native renders its catalog as an application', () => {
    const { folderlessSuffixes } = readArchitectureOptions(expo())

    expect(folderlessSuffixes).not.toContain('stories')
  })

  it('reads a container a project nests in a feature, such as the panels of an editor', () => {
    const { moduleContainers } = readArchitectureOptions(expo({ architecture: { moduleContainers: ['panels'] } }))

    expect(moduleContainers).toEqual(['features', 'libs', 'scripts', 'panels'])
    expect(
      countModuleDepth(
        ['features', 'editor', 'panels', 'color-panel', 'hooks'],
        [...EXPO_ARCHITECTURE.moduleContainers, 'panels'],
      ),
    ).toBe(4)
  })

  it('judges the local Expo modules and the catalog beside the sources, which the project writes too', () => {
    const [ownEntry] = expo().filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.files).toEqual([
      'src/**/*.{ts,tsx}',
      '{apps,libs,packages}/*/src/**/*.{ts,tsx}',
      'scripts/**/*.{ts,mts,tsx}',
      'modules/**/*.{ts,tsx}',
      '.rnstorybook/**/*.{ts,tsx}',
    ])
  })

  it('spares the catalog the rules of the layout, and only those', () => {
    const entry = expo().find(configEntry => configEntry.name === 'leandromatos/expo-catalog')

    expect(entry?.files).toEqual(['.rnstorybook/**/*.{ts,tsx}'])
    expect(Object.values(entry?.rules ?? {})).toEqual(LAYOUT_RULES.map(() => 'off'))
    expect(Object.keys(entry?.rules ?? {})).not.toContain('leandromatos/tsdoc-documented-function')
  })

  it('names in the layout only rules the plugin carries', () => {
    expect(LAYOUT_RULES.filter(rule => !(rule in (plugin.rules ?? {})))).toEqual([])
  })

  it('reads the components a design system ships under components/ui as a context of the root', () => {
    const { rootContexts } = readArchitectureOptions(expo())

    expect(rootContexts).toEqual(expect.arrayContaining(['components']))
  })

  it('ignores the registry the catalog writes again on every run', () => {
    const ignoring = expo().find(entry => entry.ignores && !entry.files && !entry.rules)

    expect(ignoring?.ignores).toContain('**/.rnstorybook/storybook.requires.ts')
  })

  it('ignores what Expo and the native builds wrote, plus what the project adds', () => {
    const ignoring = expo({ ignores: ['fastlane'] }).find(entry => entry.ignores && !entry.files && !entry.rules)

    expect(ignoring?.ignores).toEqual(expect.arrayContaining(['**/.expo', '**/android', '**/ios', 'fastlane']))
  })

  it('runs its tests under Jest, which is the runner Expo ships a preset for', () => {
    const entry = expo().find(configEntry => configEntry.name === 'leandromatos/expo-runner')

    expect(entry?.languageOptions?.globals).toHaveProperty('jest')
  })

  it('turns off what only Vitest declares for a project on Jest, so a spec cannot reach vi', () => {
    const entry = expo().find(configEntry => configEntry.name === 'leandromatos/expo-runner')

    expect(entry?.languageOptions?.globals).toMatchObject({ vi: 'off', jest: false })
  })

  it('asks the Image component for its alternative text, as an img', () => {
    const entry = expo().find(configEntry => configEntry.name === 'leandromatos/image-alt-text')

    expect(entry?.rules?.['jsx-a11y/alt-text']).toEqual(['warn', { elements: ['img'], img: ['Image'] }])
  })

  it('reads the image rule in a file outside JSX as well, whose plugin the entry names', async () => {
    const eslint = new TSESLint.ESLint({ cwd: '/repository', overrideConfigFile: true, baseConfig: expo() })

    const config: unknown = await eslint.calculateConfigForFile('/repository/src/utils/date.util.ts')

    expect(config).toHaveProperty(['rules', 'jsx-a11y/alt-text', 0], 1)
  })

  it('declares no globals of its own for a project on Vitest, which keeps the ones recommended declares', () => {
    expect(expo({ runner: 'vitest' }).map(entry => entry.name)).not.toContain('leandromatos/expo-runner')
  })

  it('spares no catalog for a project that keeps none', () => {
    expect(expo({ catalog: false }).map(entry => entry.name)).not.toContain('leandromatos/expo-catalog')
  })

  it('names no HTTP client: an end-to-end run drives a built app rather than sending a request', () => {
    const [ownEntry] = expo().filter(configEntry => configEntry.name === 'leandromatos/rules')
    const testingOptions = readRuleOptions(ownEntry, 'leandromatos/testing-e2e-over-http')

    expect(testingOptions).not.toHaveProperty('httpTest')
  })

  it('reads the runner and the layout it spares under the package', () => {
    const entries = expo({ basePath: 'packages/mobile' })
    const own = entries.filter(
      entry => entry.name === 'leandromatos/expo-runner' || entry.name === 'leandromatos/expo-catalog',
    )

    expect(own.map(entry => entry.basePath)).toEqual(['packages/mobile', 'packages/mobile'])
  })
})
