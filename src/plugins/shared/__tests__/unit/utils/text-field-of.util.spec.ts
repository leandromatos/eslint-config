import { describe, expect, it } from 'vitest'

import { textFieldOf } from '../../../utils/index.js'

describe('textFieldOf', () => {
  it('reads the text a field carries', () => {
    expect(textFieldOf({ name: '@leandromatos/eslint-config' }, 'name')).toBe('@leandromatos/eslint-config')
  })

  it('refuses a field that is missing or is not text', () => {
    expect(() => textFieldOf({}, 'name')).toThrow('The value carries no text under "name".')
    expect(() => textFieldOf({ version: 6 }, 'version')).toThrow('The value carries no text under "version".')
  })
})
