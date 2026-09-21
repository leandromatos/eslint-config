import type { PluginRule } from '../../shared/types/index.js'
import type { ValueCase } from './rules/index.js'

/** What the `naming` rules judge against. What a value, a method and a spec fixture are called. */
export interface NamingOptions {
  /**
   * Generic types of one argument, and the word each puts before the argument's name: `PaginatedEntity` as `paginated`,
   * `DeepMocked` as nothing.
   */
  genericNames: Record<string, string>
  /**
   * The types a name is not asked to carry: the ones that describe a shape rather than a subject.
   *
   * `HTMLElement` is to the DOM what `object` is to the language, and a name built on it reads worse than the one
   * the author chose: `popupHTMLElement` over `popup`. A type of the domain says what the value is, and that one
   * the name carries.
   */
  shapelessTypes: string[]
  /**
   * Names a test gives by role, not by type: `result` for what the subject answered, `expected*` for what it is
   * compared to.
   */
  roleNames: string[]
  /** The names the conventions forbid outright, wherever a declaration would give one. */
  forbiddenNames: string[]
  /** The verbs whose result is something new, and the participle that opens the name of what they return. */
  verbParticiples: Record<string, string>
  /** String values governed by the name they are declared under. */
  valueCases: ValueCase[]
  /** The matchers whose argument is what an assertion compares against, such as `toEqual`. */
  assertionMatchers: string[]
  /** The file suffixes whose public methods carry the resource of the file in their name. */
  resourceSuffixes: string[]
  /** The file stems whose resource is the verb's own subject, so their methods carry none. */
  resourceFreeStems: string[]
  /** The method names a framework calls by contract, such as lifecycle hooks, so they carry no resource. */
  resourceFreeMethods: string[]
  /** The folder tests live in, where the role names apply. */
  testFolder: string
}

/** A rule of this plugin: one options object, the vocabulary above. */
export type NamingRule<TMessageId extends string> = PluginRule<TMessageId, NamingOptions>
