import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Whether a function is the implementation of an overloaded one: the body below the signatures a caller sees.
 *
 * The caller reads the overload it calls, so each signature carries the comment, and the implementation, which no
 * caller reaches by its own signature, carries none.
 *
 * @param node - The function, or the method that holds it.
 * @returns Whether a signature of the same name comes right before it.
 */
export const isOverloadImplementation = (node: TSESTree.Node): boolean => {
  if (node.type === AST_NODE_TYPES.FunctionExpression && node.parent.type === AST_NODE_TYPES.MethodDefinition)
    return isOverloadImplementation(node.parent)
  if (node.type === AST_NODE_TYPES.MethodDefinition) return isMethodOverloaded(node)
  if (node.type === AST_NODE_TYPES.FunctionDeclaration) return isDeclarationOverloaded(node)

  return false
}

/**
 * Whether a method with a body comes right after a signature of its own name.
 *
 * @param method - The method.
 * @returns Whether the member before it is that signature.
 */
const isMethodOverloaded = (method: TSESTree.MethodDefinition): boolean => {
  if (method.value.type === AST_NODE_TYPES.TSEmptyBodyFunctionExpression) return false
  const members = method.parent.body
  const before = members[members.indexOf(method) - 1]

  const name = nameOf(method)

  return (
    name !== '' &&
    before?.type === AST_NODE_TYPES.MethodDefinition &&
    before.value.type === AST_NODE_TYPES.TSEmptyBodyFunctionExpression &&
    nameOf(before) === name
  )
}

/**
 * Whether a function declaration comes right after a signature of its own name, exported or not.
 *
 * @param declaration - The function declaration.
 * @returns Whether the statement before it declares that signature.
 */
const isDeclarationOverloaded = (declaration: TSESTree.FunctionDeclaration): boolean => {
  const statement = statementOf(declaration)
  const statements = siblingsOf(statement)
  const before = statements[statements.indexOf(statement) - 1]
  const signature = before && declarationOf(before)

  return signature?.type === AST_NODE_TYPES.TSDeclareFunction && signature.id?.name === declaration.id?.name
}

/**
 * The statement a declaration is, which is the export around it when it is exported.
 *
 * @param declaration - The declaration.
 * @returns The statement.
 */
const statementOf = (declaration: TSESTree.FunctionDeclaration): TSESTree.Node => {
  if (declaration.parent.type === AST_NODE_TYPES.ExportNamedDeclaration) return declaration.parent

  return declaration
}

/**
 * The statements a statement sits among: those of the program, of a block or of a namespace.
 *
 * @param statement - The statement.
 * @returns The statements, in order, and none where it sits in no list of statements.
 */
const siblingsOf = (statement: TSESTree.Node): TSESTree.Node[] => {
  const { parent } = statement
  if (
    parent?.type === AST_NODE_TYPES.Program ||
    parent?.type === AST_NODE_TYPES.BlockStatement ||
    parent?.type === AST_NODE_TYPES.TSModuleBlock
  )
    return parent.body

  return []
}

/**
 * What a statement declares, past the export around it.
 *
 * @param statement - The statement.
 * @returns The declaration.
 */
const declarationOf = (statement: TSESTree.Node): TSESTree.Node | null => {
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) return statement.declaration

  return statement
}

/**
 * The name a method is declared under, and an empty string for one its key computes or spells as a literal.
 *
 * @param method - The method.
 * @returns The name.
 */
const nameOf = (method: TSESTree.MethodDefinition): string => {
  const { key } = method
  if (method.computed) return ''
  if (key.type === AST_NODE_TYPES.Identifier || key.type === AST_NODE_TYPES.PrivateIdentifier) return key.name

  return ''
}
