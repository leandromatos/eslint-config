import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { locate } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { ArchitectureRule, TypeInTypesFolderMessageId } from '../types/index.js'

/**
 * A type lives in the types folder, in a file that mirrors the source it describes, and nowhere
 * else. Declared beside the code, it is found by reading the code; declared in the mirror, it is
 * found by the same path as everything else. The types folder is the one the options map the
 * type suffix to, and a declaration file (`.d.ts`) is left alone.
 */
export const typesFolder: ArchitectureRule<TypeInTypesFolderMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'An interface or a type alias is declared under the types folder.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/architecture/docs/rules/types-folder.md',
      dialects: ['TypeScript'],
    },
    messages: {
      typeOutsideTypes:
        '"{{name}}" is declared in {{file}}, outside {{folder}}/. Move it to {{folder}}/{{mirror}}.{{suffix}}.ts, the mirror of this file.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const where = locate(context)
    const [{ suffixToFolder, coLocatedTypeSuffixes, suffixFreeFolders }] = context.options
    const folder = suffixToFolder['type']
    if (!where || !folder || where.file.endsWith('.d.ts') || where.suffix === 'type') return {}
    /* What a component or a hook takes is read beside it, so the type it declares stays in the file it types. */
    if (where.suffix && coLocatedTypeSuffixes.includes(where.suffix)) return {}
    /* A file the folder names is a component too, whatever the function in it is called. */
    if (where.segments.some(segment => suffixFreeFolders.includes(segment))) return {}
    if (where.segments.includes(folder)) return {}
    const mirror = mirrorOf(where.stem, where.suffix)
    const report = (node: TSESTree.Node, name: string): void => {
      /* An augmentation names a type somebody else declared, so it belongs where the declaration it widens is read. */
      if (isAugmentation(node)) return
      context.report({
        node,
        messageId: 'typeOutsideTypes',
        data: { name, file: where.file, folder, mirror, suffix: 'type' },
      })
    }
    const listener: TSESLint.RuleListener = {
      TSInterfaceDeclaration: tsInterfaceDeclaration => report(tsInterfaceDeclaration, tsInterfaceDeclaration.id.name),
      TSTypeAliasDeclaration: tsTypeAliasDeclaration => report(tsTypeAliasDeclaration, tsTypeAliasDeclaration.id.name),
    }

    return listener
  },
}

/**
 * Whether the declaration widens a type of another module rather than declaring one of its own.
 *
 * `declare global { interface Window }` names `Window`, which TypeScript already declares: moving it to the mirror
 * would take the widening out of the file that needs it and leave the name pointing at nothing new.
 *
 * @param node - The declaration.
 * @returns Whether an enclosing `declare` block holds it.
 */
const isAugmentation = (node: TSESTree.Node): boolean => {
  for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent)
    if (ancestor.type === AST_NODE_TYPES.TSModuleDeclaration) return true

  return false
}
/**
 * The name the mirrored file carries: the stem with its suffix, or the stem alone for a file that has none.
 *
 * @param stem - The file name before its suffix.
 * @param suffix - The suffix the file carries, when it carries one.
 * @returns The name the mirror is looked for under.
 */
const mirrorOf = (stem: string, suffix: string | null): string => {
  if (!suffix) return stem

  return `${stem}.${suffix}`
}
