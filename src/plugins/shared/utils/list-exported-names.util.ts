import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Lists the names an export declaration publishes: by declaration, by variable, or in a list of the file's own names.
 * A list that re-exports another file names that file's exports, not this one's.
 *
 * @param node - The export declaration.
 * @returns The names, and none for an export that publishes nothing of this file.
 */
export const listExportedNames = (node: TSESTree.ExportNamedDeclaration): string[] => {
  const declaration = node.declaration
  if (!declaration) return listSpecifiedNames(node)
  if (declaration.type === AST_NODE_TYPES.FunctionDeclaration && declaration.id) return [declaration.id.name]
  if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return []

  return declaration.declarations.flatMap(declarator => {
    if (declarator.id.type !== AST_NODE_TYPES.Identifier) return []

    return [declarator.id.name]
  })
}

/**
 * Lists the names an export list publishes, `a` and `b` for `export { a, b }`, and none for a list that re-exports
 * another file.
 *
 * @param node - The export declaration, written as a list.
 * @returns The names.
 */
const listSpecifiedNames = (node: TSESTree.ExportNamedDeclaration): string[] => {
  if (node.source) return []

  return node.specifiers.flatMap(specifier => {
    if (specifier.exported.type !== AST_NODE_TYPES.Identifier) return []

    return [specifier.exported.name]
  })
}
