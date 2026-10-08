import { describe, expect, it } from 'vitest'

import { ruleOptionsOf } from '../../../__tests__/utils/index.js'
import { plugin } from '../../../plugins/index.js'
import { moduleDepthOf } from '../../../plugins/shared/utils/index.js'
import { EXPO_ARCHITECTURE, LAYOUT_RULES } from '../../constants/index.js'
import { expo } from '../../expo.config.js'

describe('expo', () => {
  const architectureOf = (entries: ReturnType<typeof expo>): Record<string, unknown> => {
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')

    return ruleOptionsOf(ownEntry, 'leandromatos/architecture-known-suffix')
  }

  it('adds the suffixes a project names to the map of the tier, rather than replacing it', () => {
    const { suffixToFolder } = architectureOf(expo({ architecture: { suffixToFolder: { exception: 'exceptions' } } }))

    expect(suffixToFolder).toHaveProperty('exception', 'exceptions')
    expect(suffixToFolder).toHaveProperty('storage', 'storages')
  })

  it('carries all of strict, which is what the tier is built on', () => {
    const names = expo()
      .map(entry => entry.name)
      .filter(Boolean)

    expect(names).toEqual(expect.arrayContaining(['leandromatos/recommended']))
  })

  it('names the store the device keeps, which the web reaches through a cookie instead', () => {
    const { suffixToFolder } = architectureOf(expo())

    expect(suffixToFolder).toHaveProperty('storage', 'storages')
  })

  it('leaves the story out: React Native renders its catalog as an application', () => {
    const { folderlessSuffixes } = architectureOf(expo())

    expect(folderlessSuffixes).not.toContain('stories')
  })

  it('reads a container nested in a feature, which is how an editor holds its tools', () => {
    const { moduleContainers } = architectureOf(expo())

    expect(moduleContainers).toEqual(EXPO_ARCHITECTURE.moduleContainers)
    expect(EXPO_ARCHITECTURE.moduleContainers).toEqual(expect.arrayContaining(['features', 'libs', 'tools']))
    expect(
      moduleDepthOf(['features', 'editor', 'tools', 'background-tool', 'hooks'], EXPO_ARCHITECTURE.moduleContainers),
    ).toBe(4)
  })

  it('judges the local Expo modules and the catalog beside the sources, which the project writes too', () => {
    const [ownEntry] = expo().filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual([
      'src/**/*.{ts,tsx}',
      '{apps,libs,packages}/*/src/**/*.{ts,tsx}',
      'modules/**/*.{ts,tsx}',
      '.rnstorybook/**/*.{ts,tsx}',
    ])
  })

  it('spares the catalog the rules of the layout, and only those', () => {
    const entry = expo().find(configEntry => configEntry.name === 'leandromatos/expo-unlaid')

    expect(entry?.files).toEqual(['.rnstorybook/**/*.{ts,tsx}'])
    expect(Object.values(entry?.rules ?? {})).toEqual(LAYOUT_RULES.map(() => 'off'))
    expect(Object.keys(entry?.rules ?? {})).not.toContain('leandromatos/tsdoc-documented-function')
  })

  it('names in the layout only rules the plugin carries', () => {
    expect(LAYOUT_RULES.filter(rule => !(rule in (plugin.rules ?? {})))).toEqual([])
  })

  it('reads the components a design system ships under components/ui as a context of the root', () => {
    const { rootContexts } = architectureOf(expo())

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

  it('names no HTTP client: an end-to-end run drives a built app rather than sending a request', () => {
    const [ownEntry] = expo().filter(configEntry => configEntry.name === 'leandromatos/recommended')
    const testingOptions = ruleOptionsOf(ownEntry, 'leandromatos/testing-e2e-over-http')

    expect(testingOptions).toHaveProperty(['httpTest', 'kind'], '')
  })

  it('reads the runner and the layout it spares under the package', () => {
    const entries = expo({ basePath: 'packages/mobile' })
    const own = entries.filter(
      entry => entry.name === 'leandromatos/expo-runner' || entry.name === 'leandromatos/expo-unlaid',
    )

    expect(own.map(entry => entry.basePath)).toEqual(['packages/mobile', 'packages/mobile'])
  })
})
