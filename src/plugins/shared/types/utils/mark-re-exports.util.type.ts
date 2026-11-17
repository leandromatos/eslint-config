import type { TSESTree } from '@typescript-eslint/utils'

/** A statement that exports, which is every form a re-export takes. */
export type ExportStatement =
  | TSESTree.ExportAllDeclaration
  | TSESTree.ExportDefaultDeclaration
  | TSESTree.ExportNamedDeclaration
  | TSESTree.TSExportAssignment
