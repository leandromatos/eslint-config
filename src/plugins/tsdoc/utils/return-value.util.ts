import type { ParserServicesWithTypeInformation, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import ts from 'typescript'

import { isFunctionNode, readChildNodes } from '../../shared/utils/index.js'
import type { ReturningNode } from '../types/index.js'

/** The flags of the types that carry no value. */
const NOTHING_FLAGS = ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Never

/**
 * Whether a function hands back a value a caller reads, which is what a `@returns` documents.
 *
 * A generator hands back values when its own body yields one or returns one. Otherwise the type the signature hands
 * back decides first: `void`, `undefined` and `never`, or a promise of one of them, hand back nothing, whether the
 * function is async or not. Past that, a function with a body hands a value back when an arrow writes an expression for
 * its body, or when one of its own `return` statements carries a value, which a promise built in place and resolved
 * empty is not.
 *
 * @param node - The function, or the signature without a body.
 * @param parserServices - What maps the node onto the program and its types.
 * @returns Whether it hands back a value to document.
 */
export const handsValueBack = (node: ReturningNode, parserServices: ParserServicesWithTypeInformation): boolean => {
  if (isGenerator(node)) return yieldsValue(node.body)
  if (isNothingReturned(node, parserServices)) return false
  if (!isFunctionNode(node)) return true
  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression && node.expression) return true

  return hasValueReturn(node.body)
}

/**
 * Whether a node is a generator with a body, whose value is what its body yields.
 *
 * @param node - The function, or the signature without a body.
 * @returns Whether it is a generator.
 */
const isGenerator = (node: ReturningNode): node is TSESTree.FunctionDeclaration | TSESTree.FunctionExpression =>
  (node.type === AST_NODE_TYPES.FunctionDeclaration || node.type === AST_NODE_TYPES.FunctionExpression) &&
  node.generator

/**
 * Whether a node of a generator yields a value or returns one, in the generator's own body. Delegating with `yield*`
 * yields what the other iterator yields.
 *
 * @param node - The body, or a node inside it.
 * @returns Whether the generator produces a value there.
 */
const yieldsValue = (node: TSESTree.Node): boolean => {
  if (node.type === AST_NODE_TYPES.YieldExpression || node.type === AST_NODE_TYPES.ReturnStatement)
    return node.argument !== null

  return readChildNodes(node).some(child => !isFunctionNode(child) && yieldsValue(child))
}

/**
 * Whether the type a signature hands back, awaited, is nothing: `void`, `undefined`, `never`, or a union of them.
 *
 * @param node - The function, or the signature without a body.
 * @param parserServices - What maps the node onto the program and its types.
 * @returns Whether the type says nothing comes back.
 */
const isNothingReturned = (node: ReturningNode, parserServices: ParserServicesWithTypeInformation): boolean => {
  const typeChecker = parserServices.program.getTypeChecker()
  const signature = typeChecker.getSignatureFromDeclaration(parserServices.esTreeNodeToTSNodeMap.get(node))
  const returnType = signature && typeChecker.getReturnTypeOfSignature(signature)
  const awaitedType = returnType && typeChecker.getAwaitedType(returnType)

  return Boolean(awaitedType && isNothing(awaitedType))
}

/**
 * Whether a type is one that carries no value.
 *
 * @param type - The type.
 * @returns Whether it is `void`, `undefined`, `never`, or a union of them.
 */
const isNothing = (type: ts.Type): boolean => {
  if (type.isUnion()) return type.types.every(isNothing)

  return (type.flags & NOTHING_FLAGS) !== 0
}

/**
 * Whether a node holds a `return` with a value that belongs to the function being read.
 *
 * @param node - The body, or a node inside it.
 * @returns Whether such a return is there.
 */
const hasValueReturn = (node: TSESTree.Node): boolean => {
  if (node.type === AST_NODE_TYPES.ReturnStatement)
    return node.argument !== null && !isPromiseResolvedEmpty(node.argument)

  return readChildNodes(node).some(child => !isFunctionNode(child) && hasValueReturn(child))
}

/**
 * Whether an expression builds a promise that resolves with nothing.
 *
 * The executor has to be written in place: a promise handed an executor by name, or none, resolves with nothing as
 * far as the call shows. One written in place resolves with a value when it calls its resolver with an argument
 * anywhere in its body, or hands the resolver to another function.
 *
 * @param argument - What the `return` carries.
 * @returns Whether it is a promise that resolves with nothing.
 */
const isPromiseResolvedEmpty = (argument: TSESTree.Expression): boolean => {
  if (argument.type !== AST_NODE_TYPES.NewExpression) return false
  if (argument.callee.type !== AST_NODE_TYPES.Identifier || argument.callee.name !== 'Promise') return false
  const [executor] = argument.arguments
  if (executor?.type !== AST_NODE_TYPES.ArrowFunctionExpression && executor?.type !== AST_NODE_TYPES.FunctionExpression)
    return true
  const [resolver] = executor.params
  if (resolver?.type !== AST_NODE_TYPES.Identifier) return true

  return !resolvesWithValue(executor.body, resolver.name)
}

/**
 * Whether a node calls the resolver with an argument, or reaches it any other way than a call with none.
 *
 * @param node - The body of the executor, or a node inside it.
 * @param resolverName - The name the executor gives its resolver.
 * @returns Whether the promise may resolve with a value.
 */
const resolvesWithValue = (node: TSESTree.Node, resolverName: string): boolean => {
  if (node.type === AST_NODE_TYPES.CallExpression && isResolver(node.callee, resolverName))
    return node.arguments.length > 0
  if (isResolver(node, resolverName)) return true

  return readChildNodes(node).some(child => resolvesWithValue(child, resolverName))
}

/**
 * Whether a node is the resolver, read by its name.
 *
 * @param node - The node.
 * @param resolverName - The name the executor gives its resolver.
 * @returns Whether it names the resolver.
 */
const isResolver = (node: TSESTree.Node, resolverName: string): boolean =>
  node.type === AST_NODE_TYPES.Identifier && node.name === resolverName
