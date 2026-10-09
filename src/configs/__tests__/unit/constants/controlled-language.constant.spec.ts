import { describe, expect, it } from 'vitest'

import {
  CONTROLLED_LANGUAGE,
  CONTROLLED_LANGUAGE_COMMENT_WIDTH,
  CONTROLLED_LANGUAGE_FORBIDDEN_WORDS,
  CONTROLLED_LANGUAGE_STRING_PATTERNS,
  CONTROLLED_LANGUAGE_THROWS_CONDITIONS,
  CONTROLLED_LANGUAGE_THROWS_TITLE_PROPERTIES,
} from '../../../constants/index.js'

describe('CONTROLLED_LANGUAGE', () => {
  it('shapes the calls the framework and its Swagger package declare', () => {
    const callees = new Set(CONTROLLED_LANGUAGE_STRING_PATTERNS.map(stringPattern => stringPattern.callee))

    expect(callees).toContain('this.logger.warn')
    expect(callees).toContain('new NotFoundException')
    expect(callees).toContain('ApiOperation')
    expect(callees).toContain('ApiProperty')
  })

  it('carries a reason on every pattern, which is what the report reads', () => {
    expect(CONTROLLED_LANGUAGE_STRING_PATTERNS.every(stringPattern => stringPattern.because.length > 0)).toBe(true)
  })

  it('gives every pattern something to match against', () => {
    const unmatched = CONTROLLED_LANGUAGE_STRING_PATTERNS.filter(
      stringPattern => stringPattern.must === undefined && stringPattern.mustNot === undefined,
    )

    expect(unmatched).toEqual([])
  })

  it('takes a conflict over a state of one word or "soft deleted", and no sentence', () => {
    const conflictPattern = CONTROLLED_LANGUAGE_STRING_PATTERNS.find(
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
    const sources = CONTROLLED_LANGUAGE_STRING_PATTERNS.flatMap(({ must, mustNot, target }) =>
      [must, mustNot, target].filter((source): source is string => source !== undefined),
    )

    expect(() => sources.forEach(source => new RegExp(source))).not.toThrow()
  })

  it('forbids "data" as the last word of a name, with the reason the report reads', () => {
    expect(CONTROLLED_LANGUAGE_FORBIDDEN_WORDS).toEqual([expect.objectContaining({ word: 'data', position: 'last' })])
  })

  it('rewords the title of an internal error into the condition of its throw tag', () => {
    const [throwsCondition] = CONTROLLED_LANGUAGE_THROWS_CONDITIONS
    const title = 'Error while reading the user.'

    expect(title.replace(new RegExp(throwsCondition?.title ?? ''), throwsCondition?.condition ?? '')).toBe(
      'When reading the user fails.',
    )
    expect(CONTROLLED_LANGUAGE_THROWS_TITLE_PROPERTIES).toEqual(['title'])
  })

  it('is a preset of the groups each constant names', () => {
    expect(CONTROLLED_LANGUAGE).toEqual({
      naming: { forbiddenWords: CONTROLLED_LANGUAGE_FORBIDDEN_WORDS },
      tsdoc: {
        commentWidth: CONTROLLED_LANGUAGE_COMMENT_WIDTH,
        throwsConditions: CONTROLLED_LANGUAGE_THROWS_CONDITIONS,
        throwsTitleProperties: CONTROLLED_LANGUAGE_THROWS_TITLE_PROPERTIES,
      },
      text: { stringPatterns: CONTROLLED_LANGUAGE_STRING_PATTERNS },
    })
  })
})
