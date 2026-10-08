import type { TSESTree } from '@typescript-eslint/utils'

/** A function or a signature a `@returns` documents. */
export type ReturningNode = TSESTree.FunctionLike | TSESTree.TSMethodSignature | TSESTree.TSFunctionType
