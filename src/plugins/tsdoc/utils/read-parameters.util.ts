import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Parameter } from '../types/index.js'
import { ParameterKind } from '../types/index.js'

/**
 * Reads the parameters a comment documents, in the order the signature declares them.
 *
 * A `this` parameter types the receiver and is never a value the caller passes, so it is left out. A parameter
 * property of a constructor is documented by its name, like any other. A parameter typed by an object literal is read
 * as a destructured one: the literal names its properties where it is declared.
 *
 * @param parameters - The parameters of the function or of the method signature.
 * @returns One entry per parameter a caller passes.
 */
export const readParameters = (parameters: TSESTree.Parameter[]): Parameter[] =>
  parameters.filter(parameter => !isThisParameter(parameter)).map(parameter => readParameter(parameter))

/**
 * Whether a parameter is the `this` TypeScript declares to type the receiver.
 *
 * @param parameter - The parameter.
 * @returns Whether it is that one.
 */
const isThisParameter = (parameter: TSESTree.Parameter): boolean =>
  parameter.type === AST_NODE_TYPES.Identifier && parameter.name === 'this'

/**
 * Reads one parameter: its name and how it is declared.
 *
 * @param parameter - The parameter.
 * @returns The parameter, as a comment documents it.
 */
const readParameter = (parameter: TSESTree.Parameter): Parameter => {
  if (parameter.type === AST_NODE_TYPES.TSParameterProperty) return readParameter(parameter.parameter)
  if (parameter.type === AST_NODE_TYPES.Identifier && isObjectTyped(parameter))
    return { name: '', kind: ParameterKind.DESTRUCTURED }
  if (parameter.type === AST_NODE_TYPES.Identifier) return { name: parameter.name, kind: ParameterKind.NAMED }
  if (parameter.type === AST_NODE_TYPES.AssignmentPattern) return readParameter(parameter.left)
  if (parameter.type === AST_NODE_TYPES.RestElement) {
    const name = restNameOf(parameter.argument)

    return { name, kind: ParameterKind.REST }
  }

  return { name: '', kind: ParameterKind.DESTRUCTURED }
}

/**
 * Whether a parameter is typed by an object literal in its own signature, which documents its properties where it is
 * declared, the way a destructured parameter does.
 *
 * @param identifier - The parameter.
 * @returns Whether its type is an object literal.
 */
const isObjectTyped = (identifier: TSESTree.Identifier): boolean =>
  identifier.typeAnnotation?.typeAnnotation.type === AST_NODE_TYPES.TSTypeLiteral

/**
 * The name a rest parameter is documented by: its own, or the names it destructures into, joined by commas.
 *
 * @param argument - What the rest element binds.
 * @returns The name.
 */
const restNameOf = (argument: TSESTree.DestructuringPattern): string => {
  if (argument.type === AST_NODE_TYPES.Identifier) return argument.name
  if (argument.type === AST_NODE_TYPES.ArrayPattern)
    return argument.elements.map(element => elementNameOf(element)).join(',')

  return ''
}

/**
 * The name of one element a rest parameter destructures into.
 *
 * @param element - The element, or null for a hole in the pattern.
 * @returns The name, and an empty string for anything that is not one identifier.
 */
const elementNameOf = (element: TSESTree.DestructuringPattern | null): string => {
  if (element?.type === AST_NODE_TYPES.Identifier) return element.name

  return ''
}
