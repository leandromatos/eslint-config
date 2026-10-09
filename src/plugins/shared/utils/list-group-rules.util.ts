import type { GroupRule } from '../types/index.js'

/**
 * Lists the rules of one group, each carrying the group its options come from, so a group is named once for all of
 * its rules.
 *
 * @param group - The group of the options the rules read.
 * @param rules - The rules, by their name within the group.
 * @returns The rules, each with its name and its group.
 */
export const listGroupRules = <TGroup extends string, TRule>(
  group: TGroup,
  rules: Record<string, TRule>,
): GroupRule<TGroup, TRule>[] => Object.entries(rules).map(([name, rule]) => ({ name, rule, group }))
