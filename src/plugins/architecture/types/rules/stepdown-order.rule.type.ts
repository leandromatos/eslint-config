import type { TSESTree } from '@typescript-eslint/utils'

/** The messages `stepdown-order` reports. */
export type StepdownOrderMessageId = 'calleeBeforeCaller' | 'siblingsOutOfOrder'

/** A function declared at the top level of a module: its name, its node, and what it calls, in order. */
export interface ModuleFunction {
  /** The name the function is declared under. */
  name: string
  /** The statement the declaration belongs to, which is what a report points at. */
  node: TSESTree.Node
  /** The names it calls, in the order the body reaches them. */
  calls: string[]
}
