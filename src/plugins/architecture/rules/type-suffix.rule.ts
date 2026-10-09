import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, escapeRegExp, locateFile } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA, TYPE_SUFFIX } from '../constants/index.js'
import type { ArchitectureRule, GovernedSuffix, TypeSuffixMessageId } from '../types/index.js'

/**
 * An exported type that uses one of the governed suffixes uses it at the end of its name, and
 * uses one that belongs to the folder it is declared under. A name that uses none is a concept
 * and is left alone. The folder is the one right below the types folder, so `types/repositories/`
 * is judged by the entry for `repositories`.
 */
export const typeSuffix: ArchitectureRule<TypeSuffixMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'An exported type that uses a governed suffix uses it last, and in the folder it belongs to.',
      url: buildRuleDocsUrl('architecture', 'type-suffix'),
      dialects: ['TypeScript'],
    },
    messages: {
      wrongFolder:
        '"{{name}}" uses the suffix {{used}}, which belongs to {{owner}}/, not {{folder}}/. Move it, or name it by a suffix of {{folder}}/.',
      suffixInside: '"{{name}}" carries {{used}} in the middle. The suffix closes the name: move it to the end.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locateFile(context)
    const [options] = context.options
    const typesFolder = options.suffixToFolder[TYPE_SUFFIX]
    if (!where || where.suffix !== TYPE_SUFFIX || !typesFolder) return {}
    const typesAt = where.segments.indexOf(typesFolder)
    const folder = where.segments[typesAt + 1]
    if (typesAt < 0 || !folder) return {}
    const allowed = options.typeSuffixes[folder]
    if (!allowed) return {}
    const governed = listGovernedSuffixes(options.typeSuffixes)
    const listener: TSESLint.RuleListener = {
      ExportNamedDeclaration: node => {
        const name = readExportedTypeName(node)
        if (!name) return
        // A suffix is a whole word inside the name: `Meta` in `UserMeta`, not in `Metadata`.
        const governing = governed.find(({ pattern }) => pattern.test(name))
        if (!governing) return
        const used = governing.suffix
        if (!allowed.includes(used)) {
          context.report({ node, messageId: 'wrongFolder', data: { name, used, owner: governing.folder, folder } })

          return
        }
        if (name.endsWith(used)) return
        context.report({ node, messageId: 'suffixInside', data: { name, used } })
      },
    }

    return listener
  },
}

/**
 * The name of the interface or the type an export declares.
 *
 * @param node - The export declaration.
 * @returns The name, or `null` for an export that declares no type.
 */
const readExportedTypeName = (node: TSESTree.ExportNamedDeclaration): string | null => {
  const declaration = node.declaration
  if (declaration?.type === AST_NODE_TYPES.TSInterfaceDeclaration) return declaration.id.name
  if (declaration?.type === AST_NODE_TYPES.TSTypeAliasDeclaration) return declaration.id.name

  return null
}

/**
 * Lists every suffix the map governs, with the folder that owns it and the pattern that finds it as a whole word.
 *
 * @param typeSuffixes - The suffixes each folder allows.
 * @returns The governed suffixes, each compiled once.
 */
const listGovernedSuffixes = (typeSuffixes: Record<string, string[]>): GovernedSuffix[] =>
  Object.entries(typeSuffixes).flatMap(([folder, suffixes]) =>
    suffixes.map(suffix => {
      const pattern = new RegExp(`${escapeRegExp(suffix)}(?=[A-Z]|$)`)

      return { suffix, folder, pattern }
    }),
  )
