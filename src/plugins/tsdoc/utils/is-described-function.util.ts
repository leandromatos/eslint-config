import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { DescribedFunction } from '../types/index.js'

/**
 * Whether a node is a function whose comment reads as a sentence and whose tags carry text: every function with a
 * body, and a declared one. An interface member and a method without a body are described where they are implemented.
 *
 * @param node - The node.
 * @returns Whether it is such a function.
 */
export const isDescribedFunction = (node: TSESTree.Node): node is DescribedFunction =>
  node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
  node.type === AST_NODE_TYPES.FunctionDeclaration ||
  node.type === AST_NODE_TYPES.FunctionExpression ||
  node.type === AST_NODE_TYPES.TSDeclareFunction
