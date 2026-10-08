import { describe, expect, it } from 'vitest'

import { fieldOf } from '../../../utils/index.js'

describe('fieldOf', () => {
  it('reads an own field of an object', () => {
    expect(fieldOf({ exports: { './cache': {} } }, 'exports')).toEqual({ './cache': {} })
  })

  it('answers nothing for a field the object lacks, and for a value that is not an object', () => {
    expect(fieldOf({}, 'exports')).toBeUndefined()
    expect(fieldOf(null, 'exports')).toBeUndefined()
    expect(fieldOf('manifest', 'exports')).toBeUndefined()
  })
})
