import type { TSESTree } from '@typescript-eslint/utils'
import { ASTUtils } from '@typescript-eslint/utils'

import type { FunctionNode } from '../types/index.js'

/**
 * Whether a node is a function the code writes, which is where a `return`, a `throw` or a `yield` stops belonging to
 * the function around it. The predicate is the one typescript-eslint ships.
 *
 * @param node - The node, and nothing where there is none, such as an absent initializer.
 * @returns Whether it is an arrow, a function expression or a function declaration.
 */
export const isFunctionNode = (node: TSESTree.Node | null | undefined): node is FunctionNode =>
  ASTUtils.isFunction(node)
