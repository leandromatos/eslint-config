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

  it('takes a conflict over a state of one word or "soft deleted", and no sentence', () => {
    const conflictPattern = NESTJS_TEXT.stringPatterns.find(
      stringPattern => stringPattern.callee === 'new ConflictException' && stringPattern.property === 'title',
    )
    const must = new RegExp(conflictPattern?.must ?? '')

    expect(must.test('Username already exists.')).toBe(true)
    expect(must.test('Email already in use.')).toBe(true)
    expect(must.test('Policy is not deleted.')).toBe(true)
    expect(must.test('User is not soft deleted.')).toBe(true)
    expect(must.test('Policy is not in the state it was.')).toBe(false)
    expect(must.test('User is not soft deleted yet.')).toBe(false)
  })

  it('holds a valid regular expression in every field that takes one', () => {
    const sources = NESTJS_TEXT.stringPatterns.flatMap(({ must, mustNot, target }) =>
      [must, mustNot, target].filter((source): source is string => source !== undefined),
    )

    expect(() => sources.forEach(source => new RegExp(source))).not.toThrow()
  })
})
