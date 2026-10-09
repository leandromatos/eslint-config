import { RuleTester } from '@typescript-eslint/rule-tester'

/** The roots a fixture tree holds sources under: the repository's own, and the one of a package of a workspace. */
const FIXTURE_SOURCE_ROOTS = ['src', '*/*/src']

/** How many directories deep under a root a fixture sits, its own folder at depth zero. */
const FIXTURE_FOLDER_DEPTHS = [0, 1, 2, 3, 4]

/**
 * The depths of the fixture tree the default project accepts, since a glob with `**` is refused. The root is listed
 * too, for a rule that leaves a file outside the sources alone.
 *
 * `.tsx` is listed beside `.ts` at every depth of every root: without it a component fixture is refused by the project
 * service, and a rule that reads types is never tried against the syntax React writes.
 */
const FIXTURE_DEPTHS = [
  '*.ts',
  ...FIXTURE_SOURCE_ROOTS.flatMap(root =>
    FIXTURE_FOLDER_DEPTHS.flatMap(depth =>
      ['ts', 'tsx'].map(extension => [root, ...Array.from({ length: depth }, () => '*'), `*.${extension}`].join('/')),
    ),
  ),
]

/**
 * A tester for a rule that reads the type-checker. It runs in the fixtures directory, which carries the
 * `tsconfig.json` the parser reads, so a type resolves the way it does in a project and a file lands where the rules
 * that read a location expect it.
 *
 * @param root - The directory holding the fixtures and their `tsconfig.json`.
 * @returns The tester.
 */
export const createTypedRuleTester = (root: string): RuleTester => {
  const projectService = { allowDefaultProject: FIXTURE_DEPTHS }

  return new RuleTester({ languageOptions: { parserOptions: { projectService, tsconfigRootDir: root } } })
}
