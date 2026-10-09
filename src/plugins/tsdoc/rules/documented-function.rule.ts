import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'

import { buildRuleDocsUrl, isFunctionNode, isMethod, readDeclarationName } from '../../shared/utils/index.js'
import { DOCUMENTED_MESSAGES, EMPTY_OPTIONS, OPTIONS_SCHEMA } from '../constants/index.js'
import type { DocumentedFunctionMessageId, DocumentedNode, TsdocRule } from '../types/index.js'
import { findDocBlock, isOverloadImplementation, restatesName } from '../utils/index.js'

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
      url: buildRuleDocsUrl('tsdoc', 'documented-function'),
      dialects: ['TypeScript'],
    },
    messages: DOCUMENTED_MESSAGES,
    schema: [OPTIONS_SCHEMA],
    defaultOptions: [EMPTY_OPTIONS],
  },
  create: context => {
    const { sourceCode } = context
    const judge = (documented: DocumentedNode, name: string): void => {
      const comment = findDocBlock(sourceCode, documented)
      if (!comment) {
        context.report({ node: documented, messageId: 'undocumented', data: { name } })

        return
      }
      if (restatesName(comment.value, name))
        context.report({ node: comment, messageId: 'restatesName', data: { name } })
    }
    const judgeDeclaredFunctions = (declaration: TSESTree.Node): void => {
      if (declaration.type === AST_NODE_TYPES.TSDeclareFunction) judge(declaration, declaration.id?.name ?? 'default')
      if (declaration.type === AST_NODE_TYPES.FunctionDeclaration && !isOverloadImplementation(declaration))
        judge(declaration, declaration.id?.name ?? 'default')
      if (
        declaration.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        declaration.type === AST_NODE_TYPES.FunctionExpression
      )
        judge(declaration, 'default')
      if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return
      for (const declarator of declaration.declarations) {
        if (declarator.id.type !== AST_NODE_TYPES.Identifier || !isFunctionNode(declarator.init)) continue
        judge(declarator.init, declarator.id.name)
      }
    }
    const listener: TSESLint.RuleListener = {
      MethodDefinition: node => {
        if (!isMethod(node) || isOverloadImplementation(node)) return
        judge(node, readDeclarationName(node))
      },
      Program: program => {
        for (const statement of program.body) {
          const declaration = unwrapExport(statement)
          if (declaration) judgeDeclaredFunctions(declaration)
        }
      },
    }

    return listener
  },
}

/**
 * Unwraps the declaration a top-level statement holds, looking past an `export` or an `export default`.
 *
 * @param statement - The top-level statement.
 * @returns The declaration, and null for an export that declares nothing.
 */
const unwrapExport = (statement: TSESTree.ProgramStatement): TSESTree.Node | null => {
  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) return statement.declaration
  if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) return statement.declaration

  return statement
}
