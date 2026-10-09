import { describe, expect, it } from 'vitest'

import { listResourceForms } from '../../../utils/list-resource-forms.util.js'

describe('listResourceForms', () => {
  it.each([
    ['users', ['User', 'Users']],
    ['policies', ['Policy', 'Policies']],
    ['boxes', ['Box', 'Boxes']],
    ['credential-tokens', ['CredentialToken', 'CredentialTokens', 'Token', 'Tokens']],
    ['activity', ['Activity', 'Activities']],
  ])('reads %s as %j', (stem, expected) => {
    expect(listResourceForms(stem)).toEqual(expected)
  })
})
