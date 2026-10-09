/**
 * The options of a rule, as the tester hands them: a base and what one case says on top of it, in the one-element
 * tuple a rule of this package takes.
 *
 * @param options - The options the case starts from.
 * @param overrides - What the case changes.
 * @returns The options.
 */
export const extendRuleOptions = <TOptions extends object>(
  [base]: readonly [TOptions],
  overrides: Partial<TOptions>,
): [TOptions] => [{ ...base, ...overrides }]
