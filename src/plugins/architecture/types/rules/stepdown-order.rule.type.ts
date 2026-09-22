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
  /**
   * Whether the declaration is hoisted, which a `function` is and a `const` holding an arrow is not.
   *
   * A `const` is in its temporal dead zone until the line that declares it runs, so one a module-level initializer
   * reaches cannot move below that initializer without the module throwing on import.
   */
  hoisted: boolean
}
