import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { unwrapAssertion } from './unwrap-assertion.util.js'

/** What a field of a table keyed by name is: an object written in place, or a call that builds one. */
const ROW_TYPES = new Set<string>([AST_NODE_TYPES.ObjectExpression, AST_NODE_TYPES.CallExpression])

/**
 * Whether a node sits inside a row of a table, at any depth.
 *
 * @param node - The node.
 * @returns Whether a row holds it.
 */
export const isInsideTableRow = (node: TSESTree.Node): boolean => {
  const { parent } = node
  if (!parent) return false
  if (isTableRow(parent)) return true

  return isInsideTableRow(parent)
}

/**
 * Whether a node is a row of a table: an object an item of a list holds, or a field of a map whose every field is a
 * row, which is a table keyed by name. A row is an object written in place, or a call that builds one. A row holds its
 * own fields, and what repeats down a column is the shape of the table rather than a value written twice.
 *
 * @param node - The node.
 * @returns Whether it is a row.
 */
export const isTableRow = (node: TSESTree.Node): boolean => {
  if (node.type !== AST_NODE_TYPES.ObjectExpression) return false
  const holder = readHolder(node)
  if (holder?.type === AST_NODE_TYPES.ArrayExpression) return true
  if (holder?.type !== AST_NODE_TYPES.Property) return false

  return isKeyedTable(holder.parent)
}

/**
 * Reads what holds a value, past the `as` and the `satisfies` that only check it.
 *
 * @param node - The value.
 * @returns What holds it, and nothing for the root.
 */
const readHolder = (node: TSESTree.Node): TSESTree.Node | undefined => {
  const { parent } = node
  if (parent?.type === AST_NODE_TYPES.TSAsExpression || parent?.type === AST_NODE_TYPES.TSSatisfiesExpression)
    return readHolder(parent)

  return parent
}

/**
 * Whether a map has every field, spreads aside, a row: an object written in place, or a call that builds one.
 *
 * @param map - The map.
 * @returns Whether it is a table keyed by name.
 */
const isKeyedTable = (map: TSESTree.ObjectExpression | TSESTree.ObjectPattern): boolean => {
  const fields = map.properties.filter(property => property.type === AST_NODE_TYPES.Property)

  return fields.every(field => ROW_TYPES.has(unwrapAssertion(field.value).type))
}
