import type { PluginRule } from '../../shared/types/shared.type.js'
import type { HttpTest } from './rules/e2e-over-http.rule.type.js'

/** What the `testing` rules judge against. How a spec is written and where it sits. */
export interface TestingOptions {
  /** The mirror folder that holds tests. */
  testFolder: string
  /** The kinds whose specs mirror one source file; the others assert a property of the whole. */
  mirroringTestKinds: string[]
  /** Layer suffix to the folder that holds it, which is how a spec finds its source. */
  suffixToFolder: Record<string, string>
  /** The test kind that goes through HTTP, and the module it sends requests with, when the project has one. */
  httpTest?: HttpTest
}

/** A rule of this plugin: one options object, the vocabulary above. */
export type TestingRule<TMessageId extends string> = PluginRule<TMessageId, TestingOptions>
