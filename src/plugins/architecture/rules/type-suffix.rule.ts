import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, TypeSuffixByFolderMessageId } from '../types/index.js'

/**
 * An exported type that uses one of the governed suffixes uses it at the end of its name, and
 * uses one that belongs to the folder it is declared under. A name that uses none is a concept
 * and is left alone. The folder is the one right below the types folder, so `types/repositories/`
 * is judged by the entry for `repositories`.
 */
export const typeSuffix: ArchitectureRule<TypeSuffixByFolderMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'An exported type that uses a governed suffix uses it last, and in the folder it belongs to.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/type-suffix.md',
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
    const where = locate(context)
    const [options] = context.options
    if (!where || where.suffix !== 'type') return {}
    /* v8 ignore next -- the rule reached this line by the `type` suffix, which the map named */
    const typesAt = where.segments.indexOf(options.suffixToFolder['type'] ?? '')
    const folder = where.segments[typesAt + 1]
    if (typesAt < 0 || !folder || !(folder in options.typeSuffixes)) return {}
    /* v8 ignore next -- the folder is a key of the map: the line above refused anything else */
    const allowed = options.typeSuffixes[folder] ?? []
    const governed = Object.values(options.typeSuffixes).flat()
    const listener: TSESLint.RuleListener = {
      ExportNamedDeclaration: node => {
        const name = typeNameOf(node)
        if (!name) return
        // A suffix is a whole word inside the name: `Meta` in `UserMeta`, not in `Metadata`.
        const used = governed.find(suffix => new RegExp(`${suffix}(?=[A-Z]|$)`).test(name))
        if (!used) return
        if (!allowed.includes(used)) {
          const owner = folderOf(used, options.typeSuffixes)
          context.report({ node, messageId: 'wrongFolder', data: { name, used, owner, folder } })

          return
        }
        if (name.endsWith(used)) return
        context.report({ node, messageId: 'suffixInside', data: { name, used } })
      },
    }

    return listener
  },
}

const typeNameOf = (node: TSESTree.ExportNamedDeclaration): string | null => {
  const declaration = node.declaration
  if (declaration?.type === AST_NODE_TYPES.TSInterfaceDeclaration) return declaration.id.name
  if (declaration?.type === AST_NODE_TYPES.TSTypeAliasDeclaration) return declaration.id.name

  return null
}

const folderOf = (suffix: string, typeSuffixes: Record<string, string[]>): string =>
  /* v8 ignore next -- the suffix came from the map, so a folder owns it */
  /* v8 ignore start -- the suffix came from the map, so a folder owns it */
  /* v8 ignore next -- the suffix came from the map, so a folder owns it */
  Object.keys(typeSuffixes).find(folder => typeSuffixes[folder]?.includes(suffix)) ?? ''
/* v8 ignore stop */
