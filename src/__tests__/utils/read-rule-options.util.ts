import type { TSESLint } from '@typescript-eslint/utils'

/**
 * The options a configuration entry hands one rule, read without a cast: the object after the severity.
 *
 * @param entry - The configuration entry.
 * @param rule - The rule, by the name the entry writes.
 * @returns The options, each still to be asserted on.
 * @throws Error When the entry sets the rule to a severity alone, or hands it options that are not an object.
 */
export const readRuleOptions = (
  entry: TSESLint.FlatConfig.Config | undefined,
  rule: string,
): Record<string, unknown> => {
  const ruleEntry: unknown = entry?.rules?.[rule]
  if (!Array.isArray(ruleEntry)) throw new Error(`The entry sets "${rule}" to a severity alone, or not at all.`)
  const options: unknown = ruleEntry[1]
  if (!isRecord(options)) throw new Error(`The entry sets "${rule}" with options that are not an object.`)

  return options
}

/**
 * Whether a value is an object a key can be read from.
 *
 * @param value - The value.
 * @returns Whether it is an object.
 */
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
