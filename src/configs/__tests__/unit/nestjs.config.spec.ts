import { describe, expect, it } from 'vitest'

import { ruleOptionsOf } from '../../../__tests__/utils/index.js'
import { NESTJS_ARCHITECTURE } from '../../constants/index.js'
import { nestjs } from '../../nestjs.config.js'

describe('nestjs', () => {
  const architectureOf = (entries: ReturnType<typeof nestjs>): Record<string, unknown> => {
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')

    return ruleOptionsOf(ownEntry, 'leandromatos/architecture-known-suffix')
  }

  it('adds the suffixes a project names to the map of the tier, rather than replacing it', () => {
    const { suffixToFolder } = architectureOf(nestjs({ architecture: { suffixToFolder: { exception: 'exceptions' } } }))

    expect(suffixToFolder).toHaveProperty('exception', 'exceptions')
    expect(suffixToFolder).toHaveProperty('interceptor', 'interceptors')
  })

  it('judges the sources of the repository and of each package of a workspace folder, by default', () => {
    const [ownEntry] = nestjs().filter(entry => entry.name === 'leandromatos/recommended')

    expect(ownEntry?.files).toEqual(['src/**/*.ts', '{apps,libs,packages}/*/src/**/*.ts'])
  })

  it('carries all of strict, which is what the tier is built on', () => {
    const names = nestjs()
      .map(entry => entry.name)
      .filter(Boolean)

    expect(names).toEqual(expect.arrayContaining(['leandromatos/recommended']))
  })

  it('names the layers the framework invents, over the ones architecture already had a word for', () => {
    const { suffixToFolder } = architectureOf(nestjs())

    expect(suffixToFolder).toHaveProperty('interceptor', 'interceptors')
    expect(suffixToFolder).toHaveProperty('processor', 'processors')
    expect(suffixToFolder).toHaveProperty('instrumentation', 'instrumentations')
    expect(suffixToFolder).toHaveProperty('repository', 'repositories')
    expect(suffixToFolder).toHaveProperty('worker', 'workers')
    expect(suffixToFolder).toHaveProperty('workflow', 'workflows')
  })

  it('walks a class down the layers, outermost first', () => {
    const { orderedSuffixes } = architectureOf(nestjs())

    expect(orderedSuffixes).toEqual(NESTJS_ARCHITECTURE.orderedSuffixes)
    expect(orderedSuffixes).toHaveProperty([0], 'controller')
  })

  it('names the request objects a controller takes whole', () => {
    const { wholeArguments } = architectureOf(nestjs())

    expect(wholeArguments).toEqual([{ suffix: 'controller', objects: ['params', 'query', 'body'] }])
  })

  it('lets the project say where it differs', () => {
    const { rootContexts } = architectureOf(nestjs({ architecture: { rootContexts: ['database'] } }))

    expect(rootContexts).toEqual(['database'])
  })
})
