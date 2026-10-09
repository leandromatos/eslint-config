import type { TSESTree } from '@typescript-eslint/utils'

import { toList } from './to-list.util.js'

/**
 * The AST nodes a node holds, whatever their keys.
 *
 * A walk reads every property but the parent, so it reaches statements, expressions and type annotations alike.
 *
 * @param node - The node the walk reads.
 * @returns The nodes it holds.
 */
export const readChildNodes = (node: TSESTree.Node): TSESTree.Node[] =>
  Object.entries(node)
    .filter(([key]) => key !== 'parent')
    .flatMap(([, value]): unknown[] => toList(value))
    .filter((value): value is TSESTree.Node => typeof value === 'object' && value !== null && 'type' in value)
