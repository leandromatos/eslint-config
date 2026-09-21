import { describe, expect, it } from 'vitest'

import type { ArchitectureOptions } from '../../../plugins/architecture/types/index.js'
import { NESTJS_ARCHITECTURE } from '../../constants/index.js'
import { nestjs } from '../../nestjs.config.js'

describe('nestjs', () => {
  const architectureOf = (entries: ReturnType<typeof nestjs>): ArchitectureOptions => {
    const [ownEntry] = entries.filter(entry => entry.name === 'leandromatos/recommended')
    const [, architectureOptions] = ownEntry?.rules?.['leandromatos/architecture-known-suffix'] as [
      string,
      ArchitectureOptions,
    ]

    return architectureOptions
  }

  it('carries all of strict, which is what the tier is built on', () => {
    const names = nestjs()
      .map(entry => entry.name)
      .filter(Boolean)

    expect(names).toEqual(expect.arrayContaining(['leandromatos/recommended']))
  })

  it('names the layers the framework invents, over the ones architecture already had a word for', () => {
    const { suffixToFolder } = architectureOf(nestjs())

    expect(suffixToFolder['interceptor']).toBe('interceptors')
    expect(suffixToFolder['processor']).toBe('processors')
    expect(suffixToFolder['repository']).toBe('repositories')
  })

  it('walks a class down the layers, outermost first', () => {
    const { orderedSuffixes } = architectureOf(nestjs())

    expect(orderedSuffixes).toEqual(NESTJS_ARCHITECTURE.orderedSuffixes)
    expect(orderedSuffixes[0]).toBe('controller')
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
