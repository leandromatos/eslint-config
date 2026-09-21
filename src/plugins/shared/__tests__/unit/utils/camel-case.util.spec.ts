import { describe, expect, it } from 'vitest'

import { toCamelCase, toScreamingCase } from '../../../utils/camel-case.util.js'

describe('toCamelCase', () => {
  it.each([
    ['UserEntity', 'userEntity'],
    ['OAuthClient', 'oauthClient'],
    ['HTTPError', 'httpError'],
    ['ID', 'id'],
    ['A', 'a'],
    ['user', 'user'],
  ])('reads %s as %s', (name, expected) => {
    expect(toCamelCase(name)).toBe(expected)
  })
})

describe('toScreamingCase', () => {
  it.each([
    ['RegExp', 'REG_EXP'],
    ['UserEntity', 'USER_ENTITY'],
    ['OAuthClient', 'OAUTH_CLIENT'],
    ['ID', 'ID'],
  ])('reads %s as %s', (name, expected) => {
    expect(toScreamingCase(name)).toBe(expected)
  })
})
