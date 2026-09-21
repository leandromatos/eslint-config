import { describe, expect, it } from 'vitest'

import { NESTJS_TEXT } from '../../../constants/index.js'

describe('NESTJS_TEXT', () => {
  it('shapes the calls the framework and its Swagger package declare', () => {
    const callees = new Set(NESTJS_TEXT.stringPatterns.map(stringPattern => stringPattern.callee))

    expect(callees).toContain('this.logger.warn')
    expect(callees).toContain('new NotFoundException')
    expect(callees).toContain('ApiOperation')
    expect(callees).toContain('ApiProperty')
  })

  it('carries a reason on every pattern, which is what the report reads', () => {
    expect(NESTJS_TEXT.stringPatterns.every(stringPattern => stringPattern.because.length > 0)).toBe(true)
  })

  it('gives every pattern something to match against', () => {
    expect(NESTJS_TEXT.stringPatterns.every(stringPattern => stringPattern.must ?? stringPattern.mustNot)).toBeTruthy()
  })

  it('holds a valid regular expression in every field that takes one', () => {
    const sources = NESTJS_TEXT.stringPatterns.flatMap(({ must, mustNot, target }) =>
      [must, mustNot, target].filter((source): source is string => source !== undefined),
    )

    expect(() => sources.forEach(source => new RegExp(source))).not.toThrow()
  })
})
