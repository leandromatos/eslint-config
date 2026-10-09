import type { TSESLint } from '@typescript-eslint/utils'

import { readRuleOptions } from './read-rule-options.util.js'

/**
 * Reads the architecture options a configuration hands its rules, from the entry of this package's own rules.
 *
 * @param entries - The configuration a tier answers.
 * @returns The options, each still to be asserted on.
 * @throws Error When the entry sets the rules with no options object.
 */
export const readArchitectureOptions = (entries: TSESLint.FlatConfig.Config[]): Record<string, unknown> => {
  const ownEntry = entries.find(entry => entry.name === 'leandromatos/rules')

  return readRuleOptions(ownEntry, 'leandromatos/architecture-known-suffix')
}
