import { describe, expect, it } from 'vitest'

import { MissingFieldError } from '../../../errors/index.js'
import { readField, readTextField } from '../../../utils/index.js'

describe('readField', () => {
  it('reads an own field of an object', () => {
    expect(readField({ exports: { './cache': {} } }, 'exports')).toEqual({ './cache': {} })
  })

  it('answers nothing for a field the object lacks, and for a value that is not an object', () => {
    expect(readField({}, 'exports')).toBeUndefined()
    expect(readField(null, 'exports')).toBeUndefined()
    expect(readField('manifest', 'exports')).toBeUndefined()
  })
})

describe('readTextField', () => {
  it('reads the text a field carries', () => {
    expect(readTextField({ name: '@leandromatos/eslint-config' }, 'name')).toBe('@leandromatos/eslint-config')
  })

  it('refuses a field that is missing or is not text', () => {
    expect(() => readTextField({}, 'name')).toThrow(MissingFieldError)
    expect(() => readTextField({ version: 6 }, 'version')).toThrow('The value carries no text under "version".')
  })
})
