import type { TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { ExportStatement } from '../types/utils/mark-re-exports.util.type.js'
import { importsValue } from './imports-value.util.js'
import { unwrapAssertion } from './unwrap-assertion.util.js'

/**
 * Marks the statements of a file that re-export. It judges each statement on its own.
 *
 * A re-export passes on values another file declares: `export * from`, `export { … } from`, `export {} from` and
 * `export import name = require(…)`. It is also an `export { name }`, `export default name` or `export = name` of a
 * value an import of the same file brings in. An `export type`, and an export whose names are all types, passes on no
 * value.
 *
 * @param statements - The top-level statements of the file, in the order the file writes them.
 * @returns The statements that re-export, in the order the file writes them.
 */
export const markReExports = (statements: TSESTree.ProgramStatement[]): ExportStatement[] => {
  const importedNames = new Set(statements.flatMap(listValueImportNames))
  const reExports = statements.filter(statement => isReExport(statement, importedNames))

  return reExports
}

/**
 * Lists the value bindings a statement brings in: an import, or an `import name = require(…)`. The list leaves out
 * what `import type` or an inline `type` brings in.
 *
 * @param statement - A top-level statement.
 * @returns The local names of the value bindings, and none for any other statement.
 */
const listValueImportNames = (statement: TSESTree.ProgramStatement): string[] => {
  if (statement.type === AST_NODE_TYPES.ImportDeclaration)
    return statement.specifiers
      .filter(specifier => importsValue(statement, specifier))
      .map(specifier => specifier.local.name)
  if (statement.type === AST_NODE_TYPES.TSImportEqualsDeclaration && requiresModule(statement))
    return [statement.id.name]

  return []
}

/**
 * Whether one statement re-exports.
 *
 * @param statement - A top-level statement.
 * @param importedNames - The value bindings the imports of the file bring in.
 * @returns True for a re-export.
 */
const isReExport = (statement: TSESTree.ProgramStatement, importedNames: Set<string>): statement is ExportStatement => {
  if (statement.type === AST_NODE_TYPES.ExportAllDeclaration) return statement.exportKind === 'value'
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) return isNamedReExport(statement, importedNames)
  if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration)
    return namesImport(statement.declaration, importedNames)
  if (statement.type === AST_NODE_TYPES.TSExportAssignment) return namesImport(statement.expression, importedNames)

  return false
}

/**
 * Whether an `export` with names re-exports. One with a source passes on a value name, or loads the module with none.
 * One that exports an `import name = require(…)` passes on that module. One with no source exports a value an import
 * brings in.
 *
 * @param exportNamedDeclaration - The export.
 * @param importedNames - The value bindings the imports of the file bring in.
 * @returns True for a re-export.
 */
const isNamedReExport = (
  exportNamedDeclaration: TSESTree.ExportNamedDeclaration,
  importedNames: Set<string>,
): boolean => {
  const { declaration } = exportNamedDeclaration
  if (declaration) return declaration.type === AST_NODE_TYPES.TSImportEqualsDeclaration && requiresModule(declaration)
  const isValue = (specifier: TSESTree.ExportSpecifier): boolean =>
    exportNamedDeclaration.exportKind === 'value' && specifier.exportKind === 'value'
  // `export {} from` names no value and still loads the module, so it passes on that module's side effects.
  if (exportNamedDeclaration.source)
    return (
      exportNamedDeclaration.exportKind === 'value' &&
      (exportNamedDeclaration.specifiers.length === 0 || exportNamedDeclaration.specifiers.some(isValue))
    )

  return exportNamedDeclaration.specifiers.some(
    specifier => isValue(specifier) && importedNames.has(specifier.local.name),
  )
}

/**
 * Whether an exported expression is a value an import brings in, past any `as` or `satisfies` that only types it.
 *
 * @param node - The exported expression or declaration.
 * @param importedNames - The value bindings the imports of the file bring in.
 * @returns True for an imported value.
 */
const namesImport = (node: TSESTree.Node, importedNames: Set<string>): boolean => {
  const value = unwrapAssertion(node)

  return value.type === AST_NODE_TYPES.Identifier && importedNames.has(value.name)
}

/**
 * Whether an `import name = …` binds a value of another module: `require(…)`, not `type` and not a qualified name.
 *
 * @param importEqualsDeclaration - The declaration.
 * @returns True for a value bound from another module.
 */
const requiresModule = (importEqualsDeclaration: TSESTree.TSImportEqualsDeclaration): boolean =>
  importEqualsDeclaration.importKind === 'value' &&
  importEqualsDeclaration.moduleReference.type === AST_NODE_TYPES.TSExternalModuleReference
