import { describe, expect, it } from 'vitest'

import { resourceFormsOf, toPascalCase } from '../../../utils/resource.util.js'

describe('resourceFormsOf', () => {
  it.each([
    ['users', ['User', 'Users']],
    ['policies', ['Policy', 'Policies']],
    ['boxes', ['Box', 'Boxes']],
    ['credential-tokens', ['CredentialToken', 'CredentialTokens', 'Token', 'Tokens']],
    ['activity', ['Activity', 'Activities']],
  ])('reads %s as %j', (stem, expected) => {
    expect(resourceFormsOf(stem)).toEqual(expected)
  })
})

describe('toPascalCase', () => {
  it.each([
    ['users.service', 'UsersService'],
    ['to-stored-timestamp.util', 'ToStoredTimestampUtil'],
    ['user', 'User'],
  ])('reads %s as %s', (word, expected) => {
    expect(toPascalCase(word)).toBe(expected)
  })
})
