import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { childNodesOf } from '../../shared/utils/index.js'
import type { ReturnArgumentJudge, ReturningNode } from '../types/index.js'

/** The functions a `return` belongs to on its own, so a return inside one says nothing about the function around it. */
const FUNCTIONS = new Set<string>([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
])

/** The return types that say a signature without a body hands back nothing. */
const NOTHING_TYPES = new Set<string>([
  AST_NODE_TYPES.TSVoidKeyword,
  AST_NODE_TYPES.TSUndefinedKeyword,
  AST_NODE_TYPES.TSNeverKeyword,
])

/**
 * Whether a function hands anything back to its caller, which is what a `@returns` documents.
 *
 * A function with a body hands a value back when one of its own `return` statements carries an expression, and an arrow
 * with an expression for a body always does. The type the function declares is not read there: the body is what runs.
 * A signature without a body has only its declared type, which hands a value back unless it is `void`, `undefined` or
 * `never`.
 *
 * @param node - The function, or the signature without a body.
 * @returns Whether it hands anything back.
 */
export const hasReturnValue = (node: ReturningNode): boolean => hasValue(node, () => true)

/**
 * Whether a function hands back a value a caller reads, which is what a missing `@returns` is reported for.
 *
 * It reads the function as {@link hasReturnValue} does, except for a promise a `return` builds in place: that one hands
 * back a value only when its executor resolves it with an argument, or hands the resolver on to code that might.
 *
 * @param node - The function, or the signature without a body.
 * @returns Whether it hands back a value to document.
 */
export const hasValueToDocument = (node: ReturningNode): boolean =>
  hasValue(node, argument => !isPromiseResolvedEmpty(argument))

/**
 * Whether a function hands back a value, by its body or by its declared type.
 *
 * @param node - The function, or the signature without a body.
 * @param isValue - Whether the expression a `return` carries is a value.
 * @returns Whether it hands a value back.
 */
const hasValue = (node: ReturningNode, isValue: ReturnArgumentJudge): boolean => {
  if (node.type === AST_NODE_TYPES.TSDeclareFunction || node.type === AST_NODE_TYPES.TSMethodSignature)
    return declaresValue(node.returnType)
  if (node.type === AST_NODE_TYPES.ArrowFunctionExpression && node.expression) return true

  return returnsValue(node.body, isValue)
}

/**
 * Whether a declared return type names a value.
 *
 * @param returnType - The annotation, when the signature carries one.
 * @returns Whether it names something other than nothing.
 */
const declaresValue = (returnType: TSESTree.TSTypeAnnotation | undefined): boolean => {
  if (!returnType) return false

  return !NOTHING_TYPES.has(returnType.typeAnnotation.type)
}

/**
 * Whether a node holds a `return` with a value that belongs to the function being read.
 *
 * @param node - The body, or a node inside it.
 * @param isValue - Whether the expression a `return` carries is a value.
 * @returns Whether such a return is there.
 */
const returnsValue = (node: TSESTree.Node, isValue: ReturnArgumentJudge): boolean => {
  if (node.type === AST_NODE_TYPES.ReturnStatement) return node.argument !== null && isValue(node.argument)

  return childNodesOf(node).some(child => !FUNCTIONS.has(child.type) && returnsValue(child, isValue))
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

  return childNodesOf(node).some(child => resolvesWithValue(child, resolverName))
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
