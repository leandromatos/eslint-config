import type { TSESTree } from '@typescript-eslint/utils'

/** The messages `documented-type` reports. */
export type DocumentedTypeMessageId = 'undocumented' | 'restatesName'

/** A declaration of a type: a class, an interface or a type alias. */
export type TypeDeclaration =
  | TSESTree.ClassDeclaration
  | TSESTree.ClassExpression
  | TSESTree.TSInterfaceDeclaration
  | TSESTree.TSTypeAliasDeclaration
