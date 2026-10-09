import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { Parameter } from '../types/index.js'
import { ParameterKind } from '../types/index.js'

/**
 * Reads the parameters a comment documents, in the order the signature declares them.
 *
 * A `this` parameter types the receiver and is never a value the caller passes, so it is left out. A parameter
 * property of a constructor is documented by its name, like any other, and so is a parameter typed by an object
 * literal. A rest parameter that destructures is read as a destructured one.
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
  if (parameter.type === AST_NODE_TYPES.Identifier) return buildParameter(parameter.name, ParameterKind.NAMED)
  if (parameter.type === AST_NODE_TYPES.AssignmentPattern) return readParameter(parameter.left)
  if (parameter.type === AST_NODE_TYPES.RestElement && parameter.argument.type === AST_NODE_TYPES.Identifier)
    return buildParameter(parameter.argument.name, ParameterKind.REST)

  return buildParameter('', ParameterKind.DESTRUCTURED)
}

/**
 * Builds one parameter as a comment documents it.
 *
 * @param name - The name a `@param` writes for it, and an empty string for a destructured one.
 * @param kind - How it is declared.
 * @returns The parameter.
 */
const buildParameter = (name: string, kind: ParameterKind): Parameter => ({ name, kind })
