import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import type { ExportStatement } from '../../shared/types/utils/mark-re-exports.util.type.js'
import { buildRuleDocsUrl } from '../../shared/utils/build-rule-docs-url.util.js'
import { importsValue } from '../../shared/utils/imports-value.util.js'
import { isPublishedEntrypoint } from '../../shared/utils/is-published-entrypoint.util.js'
import { locateFile } from '../../shared/utils/locate-file.util.js'
import { markReExports } from '../../shared/utils/mark-re-exports.util.js'
import { unwrapAssertion } from '../../shared/utils/unwrap-assertion.util.js'
import { EMPTY_OPTIONS } from '../constants/architecture.constant.js'
import { OPTIONS_SCHEMA } from '../constants/options.constant.js'
import type { ArchitectureRule } from '../types/architecture.type.js'
import type { ReExportOnlyAtEntrypointMessageId } from '../types/rules/re-export-only-at-entrypoint.rule.type.js'

/**
 * Only a published entrypoint re-exports. The rule reports every re-export statement in any other file.
 *
 * A re-export is an `export … from`, `export * from`, `export {} from` or `export import name = require(…)` of values.
 * It is also an `export { name }`, `export default name` or `export = name` of a value an import of the same file
 * brings in. An `export type` passes on no value, and a `.d.ts` file declares nothing that loads, so the rule judges
 * neither. A re-export loads the file it names. So every importer of a file that re-exports loads what the file passes
 * on, read or not.
 *
 * A published entrypoint is the index file at the source root, or a source file a target of the `exports` of
 * `package.json` is built from.
 */
export const reExportOnlyAtEntrypoint: ArchitectureRule<ReExportOnlyAtEntrypointMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Only a published entrypoint re-exports.',
      url: buildRuleDocsUrl('architecture', 're-export-only-at-entrypoint'),
      dialects: ['TypeScript'],
    },
    messages: {
      packageReExport:
        'This statement re-exports a package, and only a published entrypoint re-exports. Remove it, and import the package in each file that uses the name.',
      reExport:
        'This statement re-exports another file, and only a published entrypoint re-exports. Remove it, and import the declaring file in each file that uses the name.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locateFile(context)
    const [{ alias }] = context.options
    if (!where || where.file.endsWith('.d.ts')) return {}
    const listener: TSESLint.RuleListener = {
      Program: program => {
        const reExports = markReExports(program.body)
        // Most files re-export nothing, and those never read the manifest.
        if (reExports.length === 0 || isPublishedEntrypoint(where)) return
        const importSources = new Map(program.body.flatMap(listImportSources))
        for (const statement of reExports)
          context.report({ node: statement, messageId: readMessageId(statement, importSources, alias) })
      },
    }

    return listener
  },
}

/**
 * Chooses the message of a re-export: a package, when every source the statement passes on is one, since a package
 * has no declaring file of the project to import, or any other source.
 *
 * @param statement - The re-export.
 * @param importSources - The module of each name the imports of the file bind.
 * @param alias - The prefix an import names the source root with.
 * @returns The message id.
 */
const readMessageId = (
  statement: ExportStatement,
  importSources: Map<string, string>,
  alias: string,
): ReExportOnlyAtEntrypointMessageId => {
  const sources = listReExportSources(statement, importSources)
  // A statement that also passes on a file of the project has a declaring file to import.
  if (sources.every(source => isPackageSource(source, alias))) return 'packageReExport'

  return 'reExport'
}

/**
 * Lists the module each value an import of the file binds comes from, by its local name. A type passes on no value.
 *
 * @param statement - A top-level statement.
 * @returns The local names and their specifiers, and none for any other statement.
 */
const listImportSources = (statement: TSESTree.ProgramStatement): [string, string][] => {
  if (statement.type === AST_NODE_TYPES.ImportDeclaration)
    return statement.specifiers
      .filter(specifier => importsValue(statement, specifier))
      .map(specifier => [specifier.local.name, statement.source.value])
  if (statement.type !== AST_NODE_TYPES.TSImportEqualsDeclaration || statement.importKind === 'type') return []

  return readRequiredSpecifiers(statement).map(specifier => [statement.id.name, specifier])
}

/**
 * Lists the modules a re-export passes on: its own `from`, the module an exported `import name = require(…)` binds, or
 * the modules the imports of the names it exports come from.
 *
 * @param statement - The re-export.
 * @param importSources - The module of each name the imports of the file bind.
 * @returns The specifiers.
 */
const listReExportSources = (statement: ExportStatement, importSources: Map<string, string>): string[] => {
  const readImportSource = (node: TSESTree.Node): string[] => {
    const value = unwrapAssertion(node)

    return [...importSources]
      .filter(([name]) => value.type === AST_NODE_TYPES.Identifier && name === value.name)
      .map(([, source]) => source)
  }
  if (statement.type === AST_NODE_TYPES.ExportAllDeclaration) return [statement.source.value]
  if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) return readImportSource(statement.declaration)
  if (statement.type === AST_NODE_TYPES.TSExportAssignment) return readImportSource(statement.expression)
  if (statement.source) return [statement.source.value]
  if (statement.declaration?.type === AST_NODE_TYPES.TSImportEqualsDeclaration)
    return readRequiredSpecifiers(statement.declaration)

  return statement.specifiers.flatMap(specifier => readImportSource(specifier.local))
}

/**
 * Reads the module an `import name = require(…)` binds.
 *
 * @param importEqualsDeclaration - The declaration.
 * @returns The specifier, and none for a qualified name.
 */
const readRequiredSpecifiers = (importEqualsDeclaration: TSESTree.TSImportEqualsDeclaration): string[] => {
  const { moduleReference } = importEqualsDeclaration
  if (moduleReference.type !== AST_NODE_TYPES.TSExternalModuleReference) return []

  return [moduleReference.expression.value]
}

/**
 * Whether a specifier names a package: neither relative nor the alias of the source root.
 *
 * @param source - The specifier.
 * @param alias - The prefix an import names the source root with.
 * @returns True for a package, which has no declaring file of the project to import.
 */
const isPackageSource = (source: string, alias: string): boolean =>
  !source.startsWith('.') && source !== alias && !source.startsWith(`${alias}/`)
