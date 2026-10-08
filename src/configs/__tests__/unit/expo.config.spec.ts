import { describe, expect, it } from 'vitest'

import type { ArchitectureOptions } from '../../../plugins/architecture/types/index.js'
import { plugin } from '../../../plugins/index.js'
import { moduleDepthOf } from '../../../plugins/shared/utils/index.js'
import { LAYOUT_RULES } from '../../constants/index.js'
import { expo } from '../../expo.config.js'

describe('expo', () => {
  const architectureOf = (entries: ReturnType<typeof expo>): ArchitectureOptions => {
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')
    const [, architectureOptions] = ownEntry?.rules?.['leandromatos/architecture-known-suffix'] as [
      string,
      ArchitectureOptions,
    ]

    return architectureOptions
  }

  it('adds the suffixes a project names to the map of the tier, rather than replacing it', () => {
    const { suffixToFolder } = architectureOf(expo({ architecture: { suffixToFolder: { exception: 'exceptions' } } }))

    expect(suffixToFolder['exception']).toBe('exceptions')
    expect(suffixToFolder['storage']).toBe('storages')
  })

  it('carries all of strict, which is what the tier is built on', () => {
    const names = expo()
      .map(entry => entry.name)
      .filter(Boolean)

    expect(names).toEqual(expect.arrayContaining(['leandromatos/recommended']))
  })

  it('names the store the device keeps, which the web reaches through a cookie instead', () => {
    const { suffixToFolder } = architectureOf(expo())

    expect(suffixToFolder['storage']).toBe('storages')
  })

  it('leaves the story out: React Native renders its catalog as an application', () => {
    const { folderlessSuffixes } = architectureOf(expo())

    expect(folderlessSuffixes).not.toContain('stories')
  })

  it('reads a container nested in a feature, which is how an editor holds its tools', () => {
    const { moduleContainers } = architectureOf(expo())

    expect(moduleContainers).toEqual(expect.arrayContaining(['features', 'libs', 'tools']))
    expect(moduleDepthOf(['features', 'editor', 'tools', 'background-tool', 'hooks'], moduleContainers)).toBe(4)
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

  it('spares a local Expo module and the catalog the rules of the layout, and only those', () => {
    const entry = expo().find(configEntry => configEntry.name === 'leandromatos/expo-unlaid')

    expect(entry?.files).toEqual(['modules/**/*.{ts,tsx}', '.rnstorybook/**/*.{ts,tsx}'])
    expect(Object.values(entry?.rules ?? {})).toEqual(LAYOUT_RULES.map(() => 'off'))
    expect(Object.keys(entry?.rules ?? {})).not.toContain('leandromatos/tsdoc-documented-function')
  })

  it('names in the layout only rules the plugin carries', () => {
    expect(LAYOUT_RULES.filter(rule => !(rule in (plugin.rules ?? {})))).toEqual([])
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
    const [, testingOptions] = ownEntry?.rules?.['leandromatos/testing-e2e-over-http'] as [
      string,
      { httpTest: { kind: string } },
    ]

    expect(testingOptions.httpTest.kind).toBe('')
  })
})
