import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, OneExportPerUtilMessageId } from '../types/index.js'

/**
 * A utility file inside a module is named after the one function it exports, or after the
 * subject several related functions share. What it is never named after is one of the functions
 * inside a file that holds others. The root utility folder is named by domain and grows, so it
 * is left out with the other root contexts.
 */
export const oneExportPerUtil: ArchitectureRule<OneExportPerUtilMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A utility file named after a function exports that function alone.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/one-export-per-util.md',
      dialects: ['TypeScript'],
    },
    messages: {
      namedAfterOne:
        '"{{file}}" is named after {{named}} and also exports {{others}}. Name the file after the subject the exports share, or split it, one file per function.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [options] = context.options
    if (!where || where.suffix !== 'util' || options.rootContexts.includes(where.module)) return {}
    if (where.segments.includes(options.testFolder)) return {}
    const exported: string[] = []
    const listener: TSESLint.RuleListener = {
      ExportNamedDeclaration: node => {
        exported.push(...exportedNamesOf(node))
      },
      'Program:exit': program => {
        if (exported.length <= 1) return
        const named = exported.find(name => toKebabCase(name) === where.stem)
        if (!named) return
        const others = exported.filter(name => name !== named).join(', ')
        context.report({ node: program, messageId: 'namedAfterOne', data: { file: where.file, named, others } })
      },
    }

    return listener
  },
}

const exportedNamesOf = (node: TSESTree.ExportNamedDeclaration): string[] => {
  const declaration = node.declaration
  if (!declaration) return []
  if (declaration.type === AST_NODE_TYPES.FunctionDeclaration && declaration.id) return [declaration.id.name]
  if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return []

  return declaration.declarations.flatMap(declarator => {
    if (declarator.id.type !== AST_NODE_TYPES.Identifier) return []

    return [declarator.id.name]
  })
}

const toKebabCase = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
