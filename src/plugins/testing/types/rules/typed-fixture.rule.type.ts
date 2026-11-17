import type { TSESTree } from '@typescript-eslint/utils'

/** The messages `typed-fixture` reports. */
export type TypedFixtureMessageId = 'anonymousFixture'

/** Where a fixture is handed to the subject: the call, the position of the argument, and the callee as written. */
export interface ArgumentUsage {
  /** The call the fixture is an argument of. */
  call: TSESTree.CallExpression
  /** The position of the fixture among the arguments. */
  index: number
  /** The callee, as the source writes it, for the message. */
  callee: string
}
