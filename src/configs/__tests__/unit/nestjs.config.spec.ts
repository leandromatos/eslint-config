import { describe, expect, it } from 'vitest'

import { readArchitectureOptions } from '../../../__tests__/utils/index.js'
import { NESTJS_ARCHITECTURE } from '../../constants/index.js'
import { nestjs } from '../../nestjs.config.js'
import { strict } from '../../strict.config.js'

describe('nestjs', () => {
  it('adds the suffixes a project names to the map of the tier, rather than replacing it', () => {
    const { suffixToFolder } = readArchitectureOptions(
      nestjs({ architecture: { suffixToFolder: { exception: 'exceptions' } } }),
    )

    expect(suffixToFolder).toHaveProperty('exception', 'exceptions')
    expect(suffixToFolder).toHaveProperty('interceptor', 'interceptors')
  })

  it('judges the sources of the repository, of each package of a workspace folder, and the root scripts, by default', () => {
    const [ownEntry] = nestjs().filter(entry => entry.name === 'leandromatos/rules')

    expect(ownEntry?.files).toEqual(['src/**/*.ts', '{apps,libs,packages}/*/src/**/*.ts', 'scripts/**/*.{ts,mts}'])
  })

  it('opens with every entry of strict, in the order strict writes them', () => {
    const expectedStrictNames = strict().map(entry => entry.name)

    expect(
      nestjs()
        .map(entry => entry.name)
        .slice(0, expectedStrictNames.length),
    ).toEqual(expectedStrictNames)
  })

  it('names the layers the framework invents, over the ones architecture already had a word for', () => {
    const { suffixToFolder } = readArchitectureOptions(nestjs())

    expect(suffixToFolder).toHaveProperty('interceptor', 'interceptors')
    expect(suffixToFolder).toHaveProperty('processor', 'processors')
    expect(suffixToFolder).toHaveProperty('instrumentation', 'instrumentations')
    expect(suffixToFolder).toHaveProperty('repository', 'repositories')
    expect(suffixToFolder).toHaveProperty('worker', 'workers')
    expect(suffixToFolder).toHaveProperty('workflow', 'workflows')
  })

  it('walks a class down the layers, outermost first', () => {
    const { orderedSuffixes } = readArchitectureOptions(nestjs())

    expect(orderedSuffixes).toEqual(NESTJS_ARCHITECTURE.orderedSuffixes)
    expect(orderedSuffixes).toHaveProperty([0], 'controller')
  })

  it('names the request objects a controller takes whole', () => {
    const { wholeArguments } = readArchitectureOptions(nestjs())

    expect(wholeArguments).toEqual([{ suffix: 'controller', objects: ['params', 'query', 'body'] }])
  })

  it('joins the contexts a project names to the ones of the tier', () => {
    const { rootContexts } = readArchitectureOptions(nestjs({ architecture: { rootContexts: ['factories'] } }))

    expect(rootContexts).toEqual([...NESTJS_ARCHITECTURE.rootContexts, 'factories'])
  })
})
