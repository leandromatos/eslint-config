import { RuleTester } from '@typescript-eslint/rule-tester'

/**
 * The depths of the fixture tree the default project accepts, since a glob with `**` is refused.
 *
 * `.tsx` is listed beside `.ts`: without it a component fixture is refused by the project service, and a rule that
 * reads types is never tried against the syntax React writes.
 */
const FIXTURE_DEPTHS = [
  'src/*.ts',
  'src/*/*.ts',
  'src/*/*/*.ts',
  'src/*/*/*/*.ts',
  'src/*/*/*/*/*.ts',
  'src/*.tsx',
  'src/*/*.tsx',
  'src/*/*/*.tsx',
  'src/*/*/*/*.tsx',
  'src/*/*/*/*/*.tsx',
]

/**
 * A tester for a rule that reads the type-checker. It runs in the fixtures directory, which carries the
 * `tsconfig.json` the parser reads, so a type resolves the way it does in a project and a file lands where the rules
 * that read a location expect it.
 *
 * @param root - The directory holding the fixtures and their `tsconfig.json`.
 * @returns The tester.
 */
export const typedRuleTester = (root: string): RuleTester => {
  const projectService = { allowDefaultProject: FIXTURE_DEPTHS }

  return new RuleTester({ languageOptions: { parserOptions: { projectService, tsconfigRootDir: root } } })
}
