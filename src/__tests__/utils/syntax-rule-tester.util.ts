import { RuleTester } from '@typescript-eslint/rule-tester'

/**
 * A tester for a rule that reads the syntax alone.
 *
 * A factory rather than one shared instance: `eslint-plugin-eslint-plugin` reads a suite by the call that builds its
 * tester, and an instance imported from elsewhere leaves the spec looking like any other file.
 *
 * @returns The tester.
 */
export const syntaxRuleTester = (): RuleTester => new RuleTester({ languageOptions: { sourceType: 'module' } })
