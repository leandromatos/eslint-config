import type { TSESLint } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, listExportedNames, locateFile, toKebabCase } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA, UTIL_SUFFIX } from '../constants/index.js'
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
      url: buildRuleDocsUrl('architecture', 'one-export-per-util'),
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
    const where = locateFile(context)
    const [options] = context.options
    if (!where || where.suffix !== UTIL_SUFFIX || options.rootContexts.includes(where.module)) return {}
    if (where.segments.includes(options.testFolder) || where.segments.includes(options.mockFolder)) return {}
    const exported: string[] = []
    const listener: TSESLint.RuleListener = {
      ExportNamedDeclaration: node => {
        exported.push(...listExportedNames(node))
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
