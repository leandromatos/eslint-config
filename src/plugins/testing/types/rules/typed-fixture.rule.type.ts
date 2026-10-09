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

/** Where the fix of a fixture writes from, and how it names the barrel of a type it imports. */
export interface FixtureFixOrigin {
  /** The source root the file being fixed sits under, which the alias reaches. */
  sourceRoot: string
  /** The absolute path of the file being fixed. */
  file: string
  /** The prefix an import names the source root with. */
  alias: string
}

/** The named type a callee declares for a parameter, and the file that declares it. */
export interface DeclaredType {
  /** The name of the type. */
  name: string
  /** The absolute path of the file that declares it. */
  file: string
}
