import { parse } from '@typescript-eslint/typescript-estree'
import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { describe, expect, it } from 'vitest'

import { declarationNameOf } from '../../../utils/declaration-name.util.js'

/**
 * The first class of a snippet, or its first member when the snippet asks for one.
 *
 * @param code - The class, written out.
 * @param member - Whether the member is what the test reads.
 * @returns The declaration.
 * @throws Error When the snippet declares no class.
 */
const declarationOf = (code: string, member: boolean): TSESTree.ClassDeclaration | TSESTree.MethodDefinition => {
  const [first] = parse(code).body
  const statement = first?.type === AST_NODE_TYPES.ExportDefaultDeclaration ? first.declaration : first
  if (statement?.type !== AST_NODE_TYPES.ClassDeclaration) throw new Error('the snippet declares no class')
  if (!member) return statement
  const [method] = statement.body.body
  if (method?.type !== AST_NODE_TYPES.MethodDefinition) throw new Error('the class declares no method')

  return method
}

describe('declarationNameOf', () => {
  it('reads the name a class is declared with', () => {
    expect(declarationNameOf(declarationOf('class UserService {}', false))).toBe('UserService')
  })

  it('reads the name a method is declared with', () => {
    expect(declarationNameOf(declarationOf('class UserService { findOneUser() {} }', true))).toBe('findOneUser')
  })

  it('stands in for the name of a class the source leaves unnamed', () => {
    expect(declarationNameOf(declarationOf('export default class {}', false))).toBe('(anonymous)')
  })

  it('says a method under a computed key is computed, since the source spells no name', () => {
    expect(declarationNameOf(declarationOf('class UserService { [key]() {} }', true))).toBe('(computed)')
  })
})
