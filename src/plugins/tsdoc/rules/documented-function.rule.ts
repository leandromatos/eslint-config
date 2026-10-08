import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils'

import { isMethod, memberNameOf } from '../../shared/utils/index.js'
import { EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { DocumentedFunctionMessageId, TsdocRule } from '../types/index.js'
import { isOverloadImplementation, restatesName } from '../utils/index.js'

/**
 * Every method and every function a module declares carries a documentation comment, and the comment says what the name
 * cannot. The visibility decides nothing: a private method is read by the next person to edit the class exactly as a
 * public one is read at its call site, and whether a name "already answers" is a judgment two authors make differently,
 * so the presence is not left to it. What is left to the author is the text, and a text that only rewrites the name
 * into a sentence is reported, because it costs a read and goes stale on the next rename. A method an interface or a
 * base class declares is documented like any other, and `{@inheritDoc Owner.member}` is a comment that takes the text
 * of the contract. A spec and a name a framework calls are documented like any other. A function written inline as
 * an argument is not a declaration and is left alone.
 */
export const documentedFunction: TsdocRule<DocumentedFunctionMessageId> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'A method or a function a module declares carries a comment that says what its name cannot.',
      url: 'https://github.com/leandromatos/eslint-config/blob/main/src/plugins/tsdoc/docs/rules/documented-function.md',
      dialects: ['TypeScript'],
    },
    messages: {
      undocumented: '"{{name}}" carries no documentation comment.',
      restatesName:
        'The summary of "{{name}}" rewrites its name. Say what the name cannot: a constraint, a reason, a consequence.',
    },
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const judge = (documented: TSESTree.Node, name: string): void => {
      const comment = sourceCode.getCommentsBefore(documented).at(-1)
      if (!comment || comment.type !== AST_TOKEN_TYPES.Block || !comment.value.startsWith('*')) {
        context.report({ node: documented, messageId: 'undocumented', data: { name } })

        return
      }
      if (restatesName(comment.value, name))
        context.report({ node: comment, messageId: 'restatesName', data: { name } })
    }
    const judgeFunctionsOf = (statement: TSESTree.Node, documented: TSESTree.Node): void => {
      if (statement.type === AST_NODE_TYPES.TSDeclareFunction) judge(documented, statement.id?.name ?? 'default')
      if (statement.type === AST_NODE_TYPES.FunctionDeclaration && !isOverloadImplementation(statement))
        judge(documented, statement.id?.name ?? 'default')
      if (
        statement.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        statement.type === AST_NODE_TYPES.FunctionExpression
      )
        judge(documented, 'default')
      if (statement.type !== AST_NODE_TYPES.VariableDeclaration) return
      for (const declarator of statement.declarations) {
        if (declarator.id.type !== AST_NODE_TYPES.Identifier) continue
        if (
          declarator.init?.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
          declarator.init?.type !== AST_NODE_TYPES.FunctionExpression
        )
          continue
        judge(documented, declarator.id.name)
      }
    }
    const listener: TSESLint.RuleListener = {
      MethodDefinition: node => {
        if (!isMethod(node) || isOverloadImplementation(node)) return
        judge(node, memberNameOf(node))
      },
      Program: program => {
        for (const statement of program.body) {
          if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && statement.declaration)
            judgeFunctionsOf(statement.declaration, statement)
          if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration)
            judgeFunctionsOf(statement.declaration, statement)
          if (
            statement.type !== AST_NODE_TYPES.ExportNamedDeclaration &&
            statement.type !== AST_NODE_TYPES.ExportDefaultDeclaration
          )
            judgeFunctionsOf(statement, statement)
        }
      },
    }

    return listener
  },
}
