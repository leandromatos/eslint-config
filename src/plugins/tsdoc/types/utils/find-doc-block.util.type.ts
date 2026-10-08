import type { TSESTree } from '@typescript-eslint/utils'

/** A node a comment can document: any node inside the file, which is every node but the program itself. */
export type DocumentedNode = Exclude<TSESTree.Node, TSESTree.Program>
