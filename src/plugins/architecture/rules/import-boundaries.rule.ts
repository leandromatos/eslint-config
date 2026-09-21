import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, ImportBoundariesMessageId, Judgement } from '../types/index.js'

/**
 * A file reaches another layer through its barrel, and its own layer directly.
 *
 * A layer is a folder of files that share a suffix, and its barrel is what the rest of the project
 * imports. Crossing a layer by naming a file skips the barrel, which is the one place a layer
 * decides what it exposes. Inside a layer the rule turns around: the barrel re-exports the file
 * asking for it, so going through it is a cycle, and a sibling is reached by name.
 *
 * A barrel is exempt from all of it, because re-exporting its siblings is what it is for.
 */
export const importBoundaries: ArchitectureRule<ImportBoundariesMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A file reaches another layer through its barrel, and its own layer directly.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/import-boundaries.md',
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
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ suffixToFolder, testFolder, alias }] = context.options
    if (!where || where.stem === 'index') return {}
    const suffixes = Object.keys(suffixToFolder)
    if (suffixes.length === 0) return {}
    const folder = where.suffix ? suffixToFolder[where.suffix] : undefined
    const layer = folder ? layerDirectoryOf(where.segments, folder) : null
    const isTestTree = where.segments.includes(testFolder)
    const report = (node: TSESTree.Node, specifier: string): void => {
      const messageId = judge({ specifier, alias, suffixes, suffix: where.suffix, layer, isTestTree, testFolder })
      if (!messageId) return
      context.report({ node, messageId, data: { specifier, barrel: barrelOf(specifier) } })
    }
    const listener: TSESLint.RuleListener = {
      ExportAllDeclaration: exportAllDeclaration =>
        exportAllDeclaration.source && report(exportAllDeclaration, exportAllDeclaration.source.value),
      ExportNamedDeclaration: exportNamedDeclaration =>
        exportNamedDeclaration.source && report(exportNamedDeclaration, exportNamedDeclaration.source.value),
      ImportDeclaration: importDeclaration => report(importDeclaration, importDeclaration.source.value),
    }

    return listener
  },
}

/**
 * The directory the file's own layer sits in: `authorizer/tokens/entities` for an entity of that module.
 *
 * The last segment carrying the folder name is the one, so a layer nested under a mirror folder anchors on the
 * mirror rather than on the tree it mirrors.
 *
 * @param segments - The directories between the source root and the file.
 * @param folder - The folder the file's own suffix maps to.
 * @returns The directory, and null for a file that carries a suffix but does not sit in its folder.
 */
const layerDirectoryOf = (segments: string[], folder: string): string | null => {
  const last = segments.lastIndexOf(folder)
  if (last === -1) return null

  return segments.slice(0, last + 1).join('/')
}

/**
 * What is wrong with this specifier, and nothing when it is allowed.
 *
 * @param judgement - The specifier, and where the file asking for it sits.
 * @returns The message to report, and null for an import this file may write.
 */
const judge = ({
  specifier,
  alias,
  suffixes,
  suffix,
  layer,
  isTestTree,
  testFolder,
}: Judgement): ImportBoundariesMessageId | null => {
  if (specifier.startsWith('.')) return 'relativeImport'
  const prefix = `${alias}/`
  if (!specifier.startsWith(prefix)) return null
  const target = specifier.slice(prefix.length)
  const segments = target.split('/')
  if (segments.includes(testFolder)) return isTestTree ? null : 'testFromProduction'
  /*
   * A spec names the file it covers. The barrel of that layer re-exports what the spec is isolating, and a test is
   * never part of a production import graph, so what the barrel protects is not at stake here.
   */
  if (isTestTree) return null
  /* v8 ignore next -- a specifier split on its slashes always has a last segment */
  const targetSuffix = suffixOf(segments[segments.length - 1] ?? '')
  if (!targetSuffix || !suffixes.includes(targetSuffix))
    return layer && (target === layer || target === `${layer}/index`) ? 'sameLayerNeedsDirect' : null
  if (!layer) return 'layerNeedsBarrel'
  if (targetSuffix !== suffix) return 'crossLayerNeedsBarrel'

  return target.startsWith(`${layer}/`) ? null : 'crossLayerNeedsBarrel'
}

/**
 * The suffix a specifier's last segment carries: `service` for `users.service`.
 *
 * @param name - The last segment of the specifier.
 * @returns The suffix, and null for a segment written without one.
 */
const suffixOf = (name: string): string | null => {
  const parts = name.split('.')
  if (parts.length < 2) return null

  /* v8 ignore next -- the name carries a dot, so the part after it is there */
  return parts[parts.length - 1] ?? null
}

/**
 * The barrel that holds what a specifier names: `@/users/services` for `@/users/services/users.service`.
 *
 * @param specifier - The specifier as the code writes it.
 * @returns The barrel's specifier.
 */
const barrelOf = (specifier: string): string => specifier.split('/').slice(0, -1).join('/')
