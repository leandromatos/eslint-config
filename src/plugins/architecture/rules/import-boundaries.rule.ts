import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, findTestSuffix, locateFile } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, ImportBoundariesMessageId, Judgment } from '../types/index.js'

/**
 * A file reaches another layer through its barrel, and its own layer directly.
 *
 * A layer is a folder of files that share a suffix, and its barrel is what the rest of the project
 * imports. Crossing a layer by naming a file skips the barrel, which is the one place a layer
 * decides what it exposes. Inside a layer the rule turns around: the barrel re-exports the file
 * asking for it, so going through it is a cycle, and a sibling is reached by name.
 *
 * Production code reaches neither the test tree nor a testing folder, local or a package's entry: what
 * tests are built from depends on what a production install leaves out. A file only a development tool
 * loads, such as a story, is test code here, and the mock folder is part of the test tree.
 *
 * A barrel is exempt from all of it, because re-exporting its siblings is what it is for.
 */
export const importBoundaries: ArchitectureRule<ImportBoundariesMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A file reaches another layer through its barrel, and its own layer directly.',
      url: buildRuleDocsUrl('architecture', 'import-boundaries'),
      dialects: ['TypeScript'],
    },
    messages: {
      crossLayerNeedsBarrel:
        '"{{specifier}}" names a file of another layer. Import {{barrel}}, which is what that layer exposes.',
      layerNeedsBarrel: '"{{specifier}}" names a file of a layer. Import {{barrel}}, which is what that layer exposes.',
      relativeImport: '"{{specifier}}" is relative. Reach it by the alias, so the path reads the same from anywhere.',
      sameLayerNeedsDirect:
        '"{{specifier}}" is the barrel of this file\'s own layer, which re-exports this file. Name the sibling instead.',
      testFromProduction: '"{{specifier}}" is a test file, and production code is never part of a test import graph.',
      testingFromProduction:
        '"{{specifier}}" is a testing entry, which depends on what a production install leaves out. Import a runtime entry.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locateFile(context)
    const [{ suffixToFolder, testFolder, testingFolder, mockFolder, developmentSuffixes, alias }] = context.options
    if (!where || where.stem === 'index') return {}
    const suffixes = Object.keys(suffixToFolder)
    if (suffixes.length === 0) return {}
    const layer = findOwnLayer(where.segments, where.suffix, suffixToFolder)
    const isTestTree = where.segments.includes(testFolder) || where.segments.includes(mockFolder)
    const testSuffix = findTestSuffix(suffixToFolder, testFolder)
    const isDevelopmentFile = where.suffix !== null && developmentSuffixes.includes(where.suffix)
    const isTestCode =
      isTestTree ||
      where.suffix === testSuffix ||
      isDevelopmentFile ||
      (testingFolder !== '' && where.segments.includes(testingFolder))
    const report = (node: TSESTree.Node, specifier: string): void => {
      const messageId = judge({
        specifier,
        alias,
        suffixes,
        suffix: where.suffix,
        layer,
        isTestTree,
        isTestCode,
        testFolder,
        testingFolder,
        mockFolder,
      })
      if (!messageId) return
      context.report({ node, messageId, data: { specifier, barrel: readBarrelSpecifier(specifier) } })
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
 * Finds the directory of the importing file's own layer, when its suffix names a layer and the file sits in it.
 *
 * @param segments - The directories between the source root and the file.
 * @param suffix - The suffix the file carries.
 * @param suffixToFolder - The layers the project declares.
 * @returns The directory, and null for a file of no layer.
 */
const findOwnLayer = (
  segments: string[],
  suffix: string | null,
  suffixToFolder: Record<string, string>,
): string | null => {
  if (!suffix) return null
  const folder = suffixToFolder[suffix]
  if (!folder) return null

  return findLayerDirectory(segments, folder)
}

/**
 * The directory the file's own layer sits in: `accounts/tokens/entities` for an entity of that module.
 *
 * The last segment carrying the folder name is the one, so a layer nested under a mirror folder anchors on the
 * mirror rather than on the tree it mirrors.
 *
 * @param segments - The directories between the source root and the file.
 * @param folder - The folder the file's own suffix maps to.
 * @returns The directory, and null for a file that carries a suffix but does not sit in its folder.
 */
const findLayerDirectory = (segments: string[], folder: string): string | null => {
  const last = segments.lastIndexOf(folder)
  if (last === -1) return null

  return segments.slice(0, last + 1).join('/')
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
  suffixes,
  suffix,
  layer,
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
  const target = specifier.slice(prefix.length)
  const segments = target.split('/')
  const reachesTestTree = segments.includes(testFolder) || segments.includes(mockFolder)
  if (reachesTestTree) return judgeTestTreeReach(isTestTree)
  if (reachesTesting(segments)) return 'testingFromProduction'
  /*
   * A spec names the file it covers. The barrel of that layer re-exports what the spec is isolating, and a test is
   * never part of a production import graph, so what the barrel protects is not at stake here.
   */
  if (isTestTree) return null
  const targetSuffix = readSpecifierSuffix(target)
  if (!targetSuffix || !suffixes.includes(targetSuffix)) return judgeUnlayeredTarget(target, layer)
  if (!layer) return 'layerNeedsBarrel'
  if (targetSuffix !== suffix) return 'crossLayerNeedsBarrel'
  if (target.startsWith(`${layer}/`)) return null

  return 'crossLayerNeedsBarrel'
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
 * Judges a specifier that names the test tree: a test reaches another test, which is what a suite is made of, and
 * production code never does.
 *
 * @param isTestTree - Whether the importing file sits in the test tree itself.
 * @returns Nothing for a test, and the refusal for production code.
 */
const judgeTestTreeReach = (isTestTree: boolean): ImportBoundariesMessageId | null => {
  if (isTestTree) return null

  return 'testFromProduction'
}

/**
 * Reads the suffix the last segment of a specifier carries: `service` for `users/services/users.service`.
 *
 * @param specifier - The specifier after the alias.
 * @returns The suffix, and null for a segment written without one.
 */
const readSpecifierSuffix = (specifier: string): string | null => {
  const lastSegment = specifier.slice(specifier.lastIndexOf('/') + 1)
  const dot = lastSegment.lastIndexOf('.')
  if (dot < 0) return null

  return lastSegment.slice(dot + 1)
}

/**
 * Judges a specifier whose last segment names no layer: the barrel of the file's own layer, which re-exports the file
 * itself, is the one refused.
 *
 * @param target - The specifier after the alias.
 * @param layer - The directory of the importing file's own layer.
 * @returns The message to report, and null for an import this file may write.
 */
const judgeUnlayeredTarget = (target: string, layer: string | null): ImportBoundariesMessageId | null => {
  if (layer && (target === layer || target === `${layer}/index`)) return 'sameLayerNeedsDirect'

  return null
}

/**
 * Reads the barrel that holds what a specifier names: `@/users/services` for `@/users/services/users.service`.
 *
 * @param specifier - The specifier as the code writes it.
 * @returns The barrel's specifier.
 */
const readBarrelSpecifier = (specifier: string): string => specifier.slice(0, Math.max(specifier.lastIndexOf('/'), 0))
