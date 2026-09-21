import { RuleTester } from '@typescript-eslint/rule-tester'

/**
 * A tester for a rule that reads the file system around the file it judges. It runs in the fixtures directory, so a
 * path the rule builds from the working directory lands on a real file.
 *
 * @param root - The directory holding the fixtures.
 * @returns The tester.
 */
export const fileRuleTester = (root: string): RuleTester =>
  new RuleTester({ languageOptions: { sourceType: 'module', parserOptions: { tsconfigRootDir: root } } })
