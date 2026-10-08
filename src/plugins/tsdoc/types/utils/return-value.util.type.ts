import type { TSESTree } from '@typescript-eslint/utils'

import type { DescribedFunction } from './is-described-function.util.type.js'

/** A function or a signature a `@returns` documents. */
export type ReturningNode = DescribedFunction | TSESTree.TSMethodSignature
