import type { TSESTree } from '@typescript-eslint/utils'

/** The messages `method-order` reports. */
export type MethodOrderMessageId = 'outOfOrder' | 'privateBeforePublic'

/**
 * A method the order places, with the name it is sorted by. A method under a computed key has none, and is not placed.
 */
export interface NamedMethod {
  /** The method, as the class declares it. */
  node: TSESTree.MethodDefinition
  /** The name it is declared under. */
  name: string
  /** Whether a caller outside the class reads it. */
  isPublic: boolean
}
