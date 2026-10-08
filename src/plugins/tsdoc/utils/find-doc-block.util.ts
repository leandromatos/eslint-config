import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils'

import type { DocumentedNode } from '../types/index.js'

/** The calls a function handed as an argument is part of, which leave the comment to the function itself. */
const CALLS = new Set<string>([AST_NODE_TYPES.CallExpression, AST_NODE_TYPES.NewExpression])

/** The statements and the members a comment above documents the function they hold. */
const HOLDERS = new Set<string>([
  AST_NODE_TYPES.VariableDeclaration,
  AST_NODE_TYPES.ExpressionStatement,
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.Property,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.ExportDefaultDeclaration,
  AST_NODE_TYPES.ReturnStatement,
])

/**
 * Finds the documentation comment of a function, an interface method or a class.
 *
 * A declaration carries its comment above it, or above the export around it. A function written as a value carries
 * it above what holds it: the variable, the statement, the member, the return or the default export. Between the
 * function and what holds it there may be any expression, as long as none of them carries a comment of its own, and a
 * function handed straight to a call carries its comment right before it. The comment opens with exactly two
 * asterisks, and nothing but other comments stands between it and the node, each on the line right after the one
 * before.
 *
 * @param sourceCode - The source of the file.
 * @param node - What the comment documents.
 * @returns The comment, and null when none documents the node.
 */
export const findDocBlock = (sourceCode: TSESLint.SourceCode, node: DocumentedNode): TSESTree.Comment | null => {
  const anchor = anchorOf(sourceCode, node)
  let nextLine = anchor.loc.start.line
  for (const comment of sourceCode.getCommentsBefore(anchor).reverse()) {
    if (nextLine - comment.loc.end.line > 1) return null
    if (isDocComment(comment)) return comment
    nextLine = comment.loc.start.line
  }

  return null
}

/**
 * The node a comment above documents the given one through.
 *
 * @param sourceCode - The source of the file.
 * @param node - What the comment documents.
 * @returns The node the comment sits right above.
 */
const anchorOf = (sourceCode: TSESLint.SourceCode, node: DocumentedNode): TSESTree.Node => {
  if (node.type !== AST_NODE_TYPES.ArrowFunctionExpression && node.type !== AST_NODE_TYPES.FunctionExpression)
    return exportOf(node)
  if (CALLS.has(node.parent.type)) return node
  let holder: TSESTree.Node = node.parent
  while (holder.type !== AST_NODE_TYPES.Program && isPassedThrough(sourceCode, holder)) holder = holder.parent
  if (holder.type === AST_NODE_TYPES.Program || holder.type === AST_NODE_TYPES.FunctionDeclaration) return node

  return exportOf(holder)
}

/**
 * The export around a node, which is where the comment of an exported one sits.
 *
 * @param node - The declaration, or what holds the function.
 * @returns The export, or the node when nothing exports it.
 */
const exportOf = (node: DocumentedNode): TSESTree.Node => {
  const { parent } = node
  if (parent.type === AST_NODE_TYPES.ExportNamedDeclaration) return parent
  if (parent.type === AST_NODE_TYPES.ExportDefaultDeclaration) return parent

  return node
}

/**
 * Whether the search for what holds a function goes on past a node inside the file: one that carries no comment of its
 * own, is no function, and holds nothing a comment documents.
 *
 * @param sourceCode - The source of the file.
 * @param node - The node the search stands on.
 * @returns Whether the search climbs to its parent.
 */
const isPassedThrough = (sourceCode: TSESLint.SourceCode, node: TSESTree.Node): boolean =>
  !node.type.includes('Function') && !HOLDERS.has(node.type) && sourceCode.getCommentsBefore(node).length === 0

/**
 * Whether a comment is a documentation comment: a block that opens with two asterisks and not a third.
 *
 * @param comment - The comment.
 * @returns Whether it documents what follows it.
 */
const isDocComment = (comment: TSESTree.Comment): boolean =>
  comment.type === AST_TOKEN_TYPES.Block && comment.value.startsWith('*') && !comment.value.startsWith('**')
