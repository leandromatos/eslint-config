import { describe, expect, it } from 'vitest'

import {
  splitIntoWords,
  toCamelCase,
  toKebabCase,
  toLowerFirst,
  toPascalCase,
  toScreamingCase,
  toUpperFirst,
} from '../../../utils/letter-case.util.js'

describe('splitIntoWords', () => {
  it.each([
    ['userData', ['user', 'data']],
    ['UserData', ['user', 'data']],
    ['metadata', ['metadata']],
    ['OAuthClient', ['o', 'auth', 'client']],
    ['user_data', ['user', 'data']],
    ['Reads one user.', ['reads', 'one', 'user']],
    ['', []],
  ])('reads %s as %j', (name, expected) => {
    expect(splitIntoWords(name)).toEqual(expected)
  })
})

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

describe('toKebabCase', () => {
  it.each([
    ['removeExtension', 'remove-extension'],
    ['hashPassword', 'hash-password'],
    ['read', 'read'],
  ])('reads %s as %s', (name, expected) => {
    expect(toKebabCase(name)).toBe(expected)
  })
})

describe('toPascalCase', () => {
  it.each([
    ['users.service', 'UsersService'],
    ['to-stored-timestamp.util', 'ToStoredTimestampUtil'],
    ['user', 'User'],
  ])('reads %s as %s', (words, expected) => {
    expect(toPascalCase(words)).toBe(expected)
  })
})

describe('toUpperFirst', () => {
  it('raises the first letter and leaves the rest', () => {
    expect(toUpperFirst('userEntity')).toBe('UserEntity')
  })
})

describe('toLowerFirst', () => {
  it('lowers the first letter and leaves the rest', () => {
    expect(toLowerFirst('UserEntity')).toBe('userEntity')
  })
})
