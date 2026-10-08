import { RuleTester } from '@typescript-eslint/rule-tester'

/**
 * The depths of the fixture tree the default project accepts, since a glob with `**` is refused. The root is listed
 * too, for a rule that leaves a file outside the sources alone, and so is the `src/` of a package one level under a
 * workspace folder, such as `apps/x/src`.
 *
 * `.tsx` is listed beside `.ts`: without it a component fixture is refused by the project service, and a rule that
 * reads types is never tried against the syntax React writes.
 */
const FIXTURE_DEPTHS = [
  '*.ts',
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
  '*/*/src/*.ts',
  '*/*/src/*/*.ts',
  '*/*/src/*/*/*.ts',
  '*/*/src/*/*/*/*.ts',
  '*/*/src/*/*/*/*/*.ts',
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
