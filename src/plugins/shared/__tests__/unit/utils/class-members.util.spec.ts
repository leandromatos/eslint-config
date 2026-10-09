import { parse } from '@typescript-eslint/typescript-estree'
import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { isMethod, isPublic, readMemberName } from '../../../utils/class-members.util.js'

/**
 * Lists the members of the first class of a snippet, as the parser reads them.
 *
 * @param code - The class, written out.
 * @returns The members, in the order they are declared.
 * @throws Error When the snippet declares no class.
 */
const listFixtureMembers = (code: string): TSESTree.ClassElement[] => {
  const [statement] = parse(code).body
  if (statement?.type !== AST_NODE_TYPES.ClassDeclaration) throw new Error('the snippet declares no class')

  return statement.body.body
}

describe('readMemberName', () => {
  it.each([
    ['class UserService { findOneUser() {} }', 'findOneUser'],
    ['class UserService { #cache() {} }', '#cache'],
    ["class UserService { 'read'() {} }", 'read'],
    ['class UserService { 1() {} }', '1'],
    ['class UserService { [key]() {} }', null],
  ])('reads %s as %s', (code, expected) => {
    const [member] = listFixtureMembers(code)

    expect(member && isMethod(member) && readMemberName(member)).toBe(expected)
  })
})

describe('isPublic', () => {
  it.each([
    ['class UserService { findOneUser() {} }', true],
    ['class UserService { public findOneUser() {} }', true],
    ['class UserService { private findOneUser() {} }', false],
    ['class UserService { protected findOneUser() {} }', false],
    ['class UserService { #findOneUser() {} }', false],
  ])('reads %s as %s', (code, expected) => {
    const [member] = listFixtureMembers(code)

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
    const [member] = listFixtureMembers(code)

    expect(Boolean(member && isMethod(member))).toBe(expected)
  })
})
