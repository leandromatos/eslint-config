import { parse } from '@typescript-eslint/typescript-estree'
import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { readDeclarationName } from '../../../utils/read-declaration-name.util.js'

/**
 * Reads the first class of a snippet, or its first member when the snippet asks for one.
 *
 * @param code - The class, written out.
 * @param member - Whether the member is what the test reads.
 * @returns The declaration.
 * @throws Error When the snippet declares no class, or a class with no method.
 */
const readFixtureDeclaration = (
  code: string,
  member: boolean,
): TSESTree.ClassDeclaration | TSESTree.MethodDefinition => {
  const statement = unwrapDefaultExport(parse(code).body[0])
  if (statement?.type !== AST_NODE_TYPES.ClassDeclaration) throw new Error('the snippet declares no class')
  if (!member) return statement
  const [method] = statement.body.body
  if (method?.type !== AST_NODE_TYPES.MethodDefinition) throw new Error('the class declares no method')

  return method
}

describe('readDeclarationName', () => {
  it('reads the name a class is declared with', () => {
    expect(readDeclarationName(readFixtureDeclaration('class UserService {}', false))).toBe('UserService')
  })

  it('reads the name a method is declared with', () => {
    expect(readDeclarationName(readFixtureDeclaration('class UserService { findOneUser() {} }', true))).toBe(
      'findOneUser',
    )
  })

  it('stands in for the name of a class the source leaves unnamed', () => {
    expect(readDeclarationName(readFixtureDeclaration('export default class {}', false))).toBe('(anonymous)')
  })

  it('says a method under a computed key is computed, since the source spells no name', () => {
    expect(readDeclarationName(readFixtureDeclaration('class UserService { [key]() {} }', true))).toBe('(computed)')
  })
})

/**
 * Unwraps the declaration a default export holds, and leaves any other statement as it is.
 *
 * @param statement - The first statement of the snippet.
 * @returns The declaration.
 */
const unwrapDefaultExport = (statement: TSESTree.ProgramStatement | undefined): TSESTree.Node | undefined => {
  if (statement?.type === AST_NODE_TYPES.ExportDefaultDeclaration) return statement.declaration

  return statement
}
