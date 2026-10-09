import type { TSESLint } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { buildRuleDocsUrl } from '../../shared/utils/index.js'
import { DOCUMENTED_MESSAGES, EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { DocumentedTypeMessageId, TsdocRule, TypeDeclaration } from '../types/index.js'
import { findDocBlock, restatesName } from '../utils/index.js'

/**
 * Every class, interface and type alias a module declares carries a documentation comment, and the comment says what
 * the name cannot.
 *
 * A type is read wherever it is named, and the editor shows its comment there. An alias a type utility derives is no
 * exception: its right-hand side tells how the type is built, and the comment tells what it is for. A class bound to a
 * variable is declared too, and so is a type inside a `declare module` or a `declare global`. A summary that only
 * rewrites the name is reported as if it were missing. A spec and a name a framework reads are documented like any
 * other.
 */
export const documentedType: TsdocRule<DocumentedTypeMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A class, an interface or a type alias a module declares carries a comment that says what its name cannot.',
      url: buildRuleDocsUrl('tsdoc', 'documented-type'),
      dialects: ['TypeScript'],
    },
    messages: DOCUMENTED_MESSAGES,
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const judge = (node: TypeDeclaration): void => {
      const name = readTypeName(node)
      const comment = findDocBlock(sourceCode, node)
      if (!comment) {
        context.report({ node, messageId: 'undocumented', data: { name } })

        return
      }
      if (restatesName(comment.value, name))
        context.report({ node: comment, messageId: 'restatesName', data: { name } })
    }
    const listener: TSESLint.RuleListener = {
      ClassDeclaration: judge,
      TSInterfaceDeclaration: judge,
      TSTypeAliasDeclaration: judge,
      'VariableDeclarator > ClassExpression.init': judge,
    }

    return listener
  },
}

/**
 * The name a declaration goes by: its own, the variable's a class is bound to, or `default` for an anonymous default
 * export.
 *
 * @param node - The declaration.
 * @returns The name.
 */
const readTypeName = (node: TypeDeclaration): string => {
  if (node.id) return node.id.name
  if (node.parent.type === AST_NODE_TYPES.VariableDeclarator && node.parent.id.type === AST_NODE_TYPES.Identifier)
    return node.parent.id.name

  return 'default'
}
