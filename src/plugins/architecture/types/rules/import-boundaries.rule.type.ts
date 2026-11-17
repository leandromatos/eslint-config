import type { TSESTree } from '@typescript-eslint/utils'

/** The messages `import-boundaries` reports. */
export type ImportBoundariesMessageId =
  'barrelImport' | 'relativeImport' | 'testFromProduction' | 'testingFromProduction'

/** A declaration that names another module: an import, or a re-export from one. */
export type ModuleReference =
  TSESTree.ExportAllDeclaration | TSESTree.ExportNamedDeclaration | TSESTree.ImportDeclaration

/** What the rule needs to judge one specifier. */
export interface Judgment {
  /** The specifier as the code writes it. */
  specifier: string
  /** The path alias that reaches the source root. */
  alias: string
  /** The source root the alias reaches, where a barrel is looked for. */
  sourceRoot: string
  /** Whether the file doing the importing sits in the test tree, the mock folder included. */
  isTestTree: boolean
  /** Whether the file doing the importing is test code: in the test tree, a spec, a story, or in a testing folder. */
  isTestCode: boolean
  /** The folder holding tests. */
  testFolder: string
  /** The folder holding what tests are built from. */
  testingFolder: string
  /** The folder holding the stand-in of a module, which belongs to the test tree. */
  mockFolder: string
}
