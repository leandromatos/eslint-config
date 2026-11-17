import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

/**
 * Whether a name an import brings in is a value: neither `import type` nor an inline `type` leaves it out.
 *
 * @param importDeclaration - The import.
 * @param specifier - One name of the import.
 * @returns True for a value binding.
 */
export const importsValue = (
  importDeclaration: TSESTree.ImportDeclaration,
  specifier: TSESTree.ImportClause,
): boolean =>
  importDeclaration.importKind === 'value' &&
  !(specifier.type === AST_NODE_TYPES.ImportSpecifier && specifier.importKind === 'type')
