import path from 'node:path'

import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

import { INDEX_FILES } from '../../shared/constants/source.constant.js'
import { buildRuleDocsUrl } from '../../shared/utils/build-rule-docs-url.util.js'
import { findTestSuffix } from '../../shared/utils/find-test-suffix.util.js'
import { isBarrel } from '../../shared/utils/is-barrel.util.js'
import { isPublishedEntrypoint } from '../../shared/utils/is-published-entrypoint.util.js'
import { locateFile } from '../../shared/utils/locate-file.util.js'
import { markReExports } from '../../shared/utils/mark-re-exports.util.js'
import { EMPTY_OPTIONS } from '../constants/architecture.constant.js'
import { OPTIONS_SCHEMA } from '../constants/options.constant.js'
import type { ArchitectureRule } from '../types/architecture.type.js'
import type {
  ImportBoundariesMessageId,
  Judgment,
  ModuleReference,
} from '../types/rules/import-boundaries.rule.type.js'

/** The index file an import of a directory is checked against the manifest by: the extension names no build. */
const ENTRYPOINT_INDEX_FILE = 'index.ts'

/** The end of a specifier that names an index file rather than its directory: `/index`, or `/index.js`. */
const INDEX_FILE_SPECIFIER_REG_EXP = /\/index(\.[cm]?[jt]sx?)?$/

/**
 * A file imports the file that declares what it needs, and never a barrel: a directory whose index file holds at least
 * one re-export.
 *
 * A barrel loads every file it re-exports, so an import through it loads the whole directory. A test file and a
 * process boot then pay for files they never read. An import of the declaring file loads that file alone.
 *
 * Production code reaches neither the test tree nor a testing folder, local or a package's entrypoint: what
 * tests are built from depends on what a production install leaves out. A file only a development tool
 * loads, such as a story, is test code here, and the mock folder is part of the test tree.
 *
 * The rule does not judge an index file that re-exports, since re-exporting its siblings is what it does. Whether it
 * may is the call of `re-export-only-at-entrypoint`. The rule judges an index file that re-exports nothing like any
 * other file. In a published entrypoint, the rule skips the re-export statements and judges the imports.
 */
export const importBoundaries: ArchitectureRule<ImportBoundariesMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A file imports the file that declares what it needs, and never a barrel.',
      url: buildRuleDocsUrl('architecture', 'import-boundaries'),
      dialects: ['TypeScript'],
    },
    messages: {
      barrelImport:
        '"{{specifier}}" names a barrel. Import the file that declares what you need, so the import loads that file alone.',
      relativeImport: '"{{specifier}}" is relative. Reach it by the alias, so the path reads the same from anywhere.',
      testFromProduction: '"{{specifier}}" is a test file, and production code is never part of a test import graph.',
      testingFromProduction:
        '"{{specifier}}" is a testing entrypoint, which depends on what a production install leaves out. Import a runtime entrypoint.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locateFile(context)
    const [{ suffixToFolder, testFolder, testingFolder, mockFolder, developmentSuffixes, alias }] = context.options
    if (!where) return {}
    const { sourceCode } = context
    const reExports = new Set<TSESTree.Node>(markReExports(sourceCode.ast.body))
    // A published entrypoint re-exports what the package offers, so its re-export statements are not judged.
    const isEntrypoint = reExports.size > 0 && isPublishedEntrypoint(where)
    // A barrel re-exports its siblings, which is what it is for, so its own specifiers are not judged.
    if (INDEX_FILES.includes(where.file) && reExports.size > 0 && !isEntrypoint) return {}
    const isTestTree = where.segments.includes(testFolder) || where.segments.includes(mockFolder)
    const testSuffix = findTestSuffix(suffixToFolder, testFolder)
    const isDevelopmentFile = where.suffix !== null && developmentSuffixes.includes(where.suffix)
    const isTestCode =
      isTestTree ||
      where.suffix === testSuffix ||
      isDevelopmentFile ||
      (testingFolder !== '' && where.segments.includes(testingFolder))
    const report = (node: ModuleReference, specifier: string): void => {
      if (isEntrypoint && reExports.has(node)) return
      const messageId = judge({
        specifier,
        alias,
        sourceRoot: where.sourceRoot,
        isTestTree,
        isTestCode,
        testFolder,
        testingFolder,
        mockFolder,
      })
      if (!messageId) return
      context.report({ node, messageId, data: { specifier } })
    }
    const listener: TSESLint.RuleListener = {
      ExportAllDeclaration: exportAllDeclaration => report(exportAllDeclaration, exportAllDeclaration.source.value),
      ExportNamedDeclaration: exportNamedDeclaration => {
        if (exportNamedDeclaration.source) report(exportNamedDeclaration, exportNamedDeclaration.source.value)
      },
      ImportDeclaration: importDeclaration => report(importDeclaration, importDeclaration.source.value),
    }

    return listener
  },
}

/**
 * What is wrong with this specifier, and nothing when it is allowed.
 *
 * @param judgment - The specifier, and where the file asking for it sits.
 * @returns The message to report, and null for an import this file may write.
 */
const judge = ({
  specifier,
  alias,
  sourceRoot,
  isTestTree,
  isTestCode,
  testFolder,
  testingFolder,
  mockFolder,
}: Judgment): ImportBoundariesMessageId | null => {
  if (specifier.startsWith('.')) return 'relativeImport'
  const reachesTesting = (segments: string[]): boolean =>
    !isTestCode && testingFolder !== '' && segments.includes(testingFolder)
  const prefix = `${alias}/`
  if (!specifier.startsWith(prefix)) {
    if (reachesTesting(readSubpath(specifier))) return 'testingFromProduction'

    return null
  }
  const segments = readAliasSegments(specifier, alias)
  const reachesTestTree = segments.includes(testFolder) || segments.includes(mockFolder)
  if (reachesTestTree && !isTestTree) return 'testFromProduction'
  if (reachesTesting(segments)) return 'testingFromProduction'
  if (!isBarrel(path.join(sourceRoot, ...segments))) return null
  // A published entrypoint may re-export, so an import of one reaches what the package offers rather than a barrel.
  const indexFile = { packageRoot: path.dirname(sourceRoot), sourceRoot, file: ENTRYPOINT_INDEX_FILE, segments }
  if (!isPublishedEntrypoint(indexFile)) return 'barrelImport'

  return null
}

/**
 * The segments of a package specifier after the package's own name: `['database', 'testing']` for
 * `@acme/nestjs/database/testing`, and none for `@nestjs/testing`.
 *
 * @param specifier - The specifier as the code writes it.
 * @returns The segments of the subpath.
 */
const readSubpath = (specifier: string): string[] => {
  const nameLength = Number(specifier.startsWith('@')) + 1
  const subpath = specifier.split('/').slice(nameLength)

  return subpath
}

/**
 * The segments of an alias specifier after the alias, the directory a specifier of its index file names included:
 * `['users', 'services']` for `@/users/services` and for `@/users/services/index.js`.
 *
 * @param specifier - The specifier as the code writes it, which opens with the alias.
 * @param alias - The prefix an import names the source root with.
 * @returns The segments under the source root.
 */
const readAliasSegments = (specifier: string, alias: string): string[] =>
  // A specifier that names an index file by name loads the same file as one that names its directory.
  specifier
    .slice(alias.length + 1)
    .replace(INDEX_FILE_SPECIFIER_REG_EXP, '')
    .split('/')
