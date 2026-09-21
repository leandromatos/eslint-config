import { describe, expect, it } from 'vitest'

import type { ArchitectureOptions } from '../../../plugins/architecture/types/index.js'
import { moduleDepthOf } from '../../../plugins/shared/utils/index.js'
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

  it('leaves the story out: React Native renders its catalogue as an application', () => {
    const { folderlessSuffixes } = architectureOf(expo())

    expect(folderlessSuffixes).not.toContain('stories')
  })

  it('reads a container nested in a feature, which is how an editor holds its tools', () => {
    const { moduleContainers } = architectureOf(expo())

    expect(moduleContainers).toEqual(expect.arrayContaining(['features', 'libs', 'tools']))
    expect(moduleDepthOf(['features', 'editor', 'tools', 'background-tool', 'hooks'], moduleContainers)).toBe(4)
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
