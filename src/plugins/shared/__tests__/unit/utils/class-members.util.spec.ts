import { parse } from '@typescript-eslint/typescript-estree'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { isMethod, isPublic, memberNameOf } from '../../../utils/class-members.util.js'

/**
 * The members of the first class of a snippet, as the parser reads them.
 *
 * @param code - The class, written out.
 * @returns The members, in the order they are declared.
 * @throws Error When the snippet declares no class.
 */
const membersOf = (code: string) => {
  const [statement] = parse(code).body
  if (statement?.type !== AST_NODE_TYPES.ClassDeclaration) throw new Error('the snippet declares no class')

  return statement.body.body
}

describe('memberNameOf', () => {
  it('reads the name a member is declared with', () => {
    const [member] = membersOf('class UserService { findOneUser() {} }')

    expect(member && isMethod(member) && memberNameOf(member)).toBe('findOneUser')
  })

  it('answers an empty string for a member under a computed key, which names nothing', () => {
    const [member] = membersOf('class UserService { [key]() {} }')

    expect(member && isMethod(member) && memberNameOf(member)).toBe('')
  })
})

describe('isPublic', () => {
  it.each([
    ['class UserService { findOneUser() {} }', true],
    ['class UserService { public findOneUser() {} }', true],
    ['class UserService { private findOneUser() {} }', false],
    ['class UserService { protected findOneUser() {} }', false],
  ])('reads %s as %s', (code, expected) => {
    const [member] = membersOf(code)

    expect(member && isMethod(member) && isPublic(member)).toBe(expected)
  })
})

describe('isMethod', () => {
  it.each([
    ['class UserService { findOneUser() {} }', true],
    ['class UserService { constructor() {} }', false],
    ['class UserService { readonly limit = 10 }', false],
    ['class UserService { get limit() { return 10 } }', false],
  ])('reads %s as %s', (code, expected) => {
    const [member] = membersOf(code)

    expect(Boolean(member && isMethod(member))).toBe(expected)
  })
})
