/** One rule of the plugin, with the name a configuration writes and the group of the options it reads. */
export interface GroupRule<TGroup extends string, TRule> {
  /** The name of the rule within its group. */
  name: string
  /** The rule. */
  rule: TRule
  /** The group whose options the rule reads, which opens the name a configuration writes. */
  group: TGroup
}
