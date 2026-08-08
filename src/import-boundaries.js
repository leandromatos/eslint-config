import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'

/**
 * Escapes a string for literal use inside a regular expression, so an alias or a
 * folder name carrying regex metacharacters cannot change what the pattern matches.
 *
 * @param {string} value
 * @returns {string}
 */
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Collects every real layer directory under the root, so the same-layer rule can be
 * anchored to the directory a file actually lives in instead of its top-level module.
 *
 * @param {string} directory Absolute or cwd-relative path to walk.
 * @param {Record<string, string>} folderToSuffix
 * @param {Set<string>} mirrorFolders
 * @param {string[]} [segments] Path segments accumulated so far, relative to the root.
 * @returns {string[]} Root-relative layer directories, slash-separated.
 */
const collectLayerDirectories = (directory, folderToSuffix, mirrorFolders, segments = []) => {
  const directories = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const path = [...segments, entry.name]
    const parents = path.slice(0, -1)
    if (folderToSuffix[entry.name] && !parents.some(parent => mirrorFolders.has(parent)))
      directories.push(path.join('/'))
    directories.push(...collectLayerDirectories(join(directory, entry.name), folderToSuffix, mirrorFolders, path))
  }

  return directories
}

/**
 * Options accepted by {@link importBoundaries}.
 *
 * @typedef {object} ImportBoundariesOptions
 * @property {Record<string, string>} suffixToFolder Layer suffix to the folder that
 *   holds it, such as `{ entity: 'entities', service: 'services' }`. Required, and the
 *   only place the project's vocabulary lives: the package ships no default map,
 *   because a default would be one framework's convention imposed on every project.
 * @property {string} [root] Source directory to walk, relative to the ESLint working
 *   directory. Defaults to `src`.
 * @property {string} [alias] Path alias that maps to the root. Defaults to `@`.
 * @property {string[]} [mirrorFolders] Folders that mirror the layer structure without
 *   being layers — with `types` listed, `roles/types/entities` holds `*.type.ts`, not
 *   `*.entity.ts`. Defaults to none.
 * @property {string} [testFolder] Folder holding test files, such as `__tests__`. When
 *   set, production code cannot import from it, and the layer that folder maps to is
 *   exempt, since tests reaching other tests is expected. Defaults to no such rule.
 * @property {boolean} [noCycle] Whether to add `import-x/no-cycle`. Defaults to `true`.
 */

/**
 * Builds the import-boundary layer of a project's flat config.
 *
 * Files are split into two groups by their filename suffix, and each group gets a
 * different set of `no-restricted-imports` patterns.
 *
 * Files WITHOUT a layer suffix (`tokens.module.ts`, `main.ts`) reach every layer
 * through its barrel:
 *
 *     '@/authorizer/tokens/services'                  ok
 *     '@/authorizer/tokens/services/tokens.service'   Use barrel imports
 *     './services'                                    Use absolute imports
 *
 * Files WITH a layer suffix (`token.entity.ts`) follow the same rule for other
 * layers, but must NOT import the barrel of the layer they live in. That barrel
 * re-exports the importing file, so going through it is a cycle
 * (`token.entity` -> `index` -> `token.entity`). Reaching a sibling directly is
 * the way out, which is why the message reads "Same layer requires direct import":
 *
 *     from src/authorizer/tokens/entities/token.entity.ts
 *
 *     '@/authorizer/tokens/entities'                  Same layer requires direct import
 *     '@/authorizer/users/services'                   ok
 *     '@/authorizer/users/services/users.service'     Cross-layer requires barrel
 *
 * Barrels are exempt from all of it. Re-exporting sibling files is their job.
 *
 * Direct imports of a file that shares the caller's suffix are allowed only inside
 * the caller's own layer directory. Matching on the suffix alone would let an
 * `.entity.ts` reach any other `.entity.ts` in the app, including another module's,
 * which is the one hole the barrel rule exists to close.
 *
 * The returned array is meant to be spread after the base config, and after your own
 * `ignores`, which stay in the project because they are the one part that is genuinely
 * per-project.
 *
 * @param {ImportBoundariesOptions} options
 * @returns {import('eslint').Linter.Config[]}
 * @author Leandro Matos
 * @see {@link https://github.com/leandromatos/eslint-config GitHub} for more information.
 */
export const importBoundaries = ({
  suffixToFolder,
  root = 'src',
  alias = '@',
  mirrorFolders = [],
  testFolder,
  noCycle = true,
}) => {
  if (!suffixToFolder || Object.keys(suffixToFolder).length === 0)
    throw new Error('importBoundaries: `suffixToFolder` is required and cannot be empty.')

  // The walk reads the filesystem at config-load time, so a wrong root would otherwise
  // surface as an ENOENT from deep inside the package. Fail with the cause instead.
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory())
    throw new Error(
      `importBoundaries: root "${root}" is not a directory, resolved from "${cwd()}". Pass \`root\` if your sources live elsewhere.`,
    )

  const suffixes = Object.keys(suffixToFolder)
  const folderToSuffix = Object.fromEntries(Object.entries(suffixToFolder).map(([suffix, folder]) => [folder, suffix]))
  const escapedAlias = escapeRegExp(alias)

  /**
   * Test files are never part of a production import graph. Tests reaching other tests
   * is fine and expected, so the layer `testFolder` maps to opts out below.
   */
  const testPatterns = testFolder
    ? [
        {
          group: [`${alias}/**/${testFolder}/**`],
          message: 'Do not import test files in production code',
        },
      ]
    : []

  const relativePattern = {
    group: ['./*', '../*'],
    message: 'Use absolute imports',
  }

  /**
   * One override per layer directory rather than per top-level module. Anchoring on
   * the module root would leave the same-layer rule inert in nested modules: a file in
   * `authorizer/tokens/entities` would be checked against `@/authorizer/entities`,
   * a path that does not exist.
   */
  const layerOverrides = collectLayerDirectories(root, folderToSuffix, new Set(mirrorFolders)).map(directory => {
    const folder = directory.split('/').at(-1) ?? directory
    const suffix = folderToSuffix[folder]
    const escapedDirectory = escapeRegExp(directory)

    /** @type {import('eslint').Linter.RuleEntry} */
    const noRestrictedImports = [
      'error',
      {
        patterns: [
          relativePattern,
          {
            // Blocks direct file imports for every suffix but the caller's own, so
            // crossing a layer always goes through a barrel.
            group: suffixes.filter(other => other !== suffix).map(other => `${alias}/**/*.${other}`),
            message: 'Cross-layer requires barrel',
          },
          {
            // Blocks direct imports of the caller's own suffix outside the caller's own
            // layer directory, which is the half the group above cannot express: the
            // suffix is exempted there so siblings stay reachable, and the exemption is
            // global.
            //
            // The negative lookahead keeps nested paths under the layer allowed, which
            // is what mirror folders need — `types/entities/foo.type` is the same layer
            // as `types`.
            regex: `^${escapedAlias}/(?!${escapedDirectory}/).*\\.${suffix}$`,
            message: 'Cross-layer requires barrel',
          },
          {
            regex: `^${escapedAlias}/${escapedDirectory}(/index)?$`,
            message: 'Same layer requires direct import',
          },
          ...(folder === testFolder ? [] : testPatterns),
        ],
      },
    ]

    return {
      files: [`${root}/${directory}/**/*.${suffix}.ts`],
      ignores: ['**/index.ts'],
      rules: { 'no-restricted-imports': noRestrictedImports },
    }
  })

  const barrelPattern = {
    group: suffixes.map(suffix => `${alias}/**/*.${suffix}`),
    message: 'Use barrel imports',
  }

  /** @type {import('eslint').Linter.RuleEntry} */
  const barrelOnly = ['error', { patterns: [relativePattern, barrelPattern, ...testPatterns] }]

  /** @type {import('eslint').Linter.RuleEntry} */
  const barrelOnlyForTests = ['error', { patterns: [relativePattern, barrelPattern] }]

  /** @type {import('eslint').Linter.RuleEntry} */
  const noCycleRule = ['error', { maxDepth: 2 }]

  const unsuffixedIgnores = ['**/index.ts', ...suffixes.map(suffix => `**/*.${suffix}.ts`)]

  return [
    // Files without a layer suffix: every layer is reached through its barrel.
    {
      files: [`${root}/**/*.ts`],
      ignores: unsuffixedIgnores,
      rules: { 'no-restricted-imports': barrelOnly },
    },
    ...layerOverrides,
    // A file under the test folder is a test file whatever it is named. Keying the
    // exemption off the suffix alone left an unsuffixed helper there classified as
    // production code, unable to reach the test tree it belongs to. This repeats the
    // unsuffixed rules minus that one restriction, so helpers keep every other
    // constraint.
    ...(testFolder
      ? [
          {
            files: [`${root}/**/${testFolder}/**/*.ts`],
            ignores: unsuffixedIgnores,
            rules: { 'no-restricted-imports': barrelOnlyForTests },
          },
        ]
      : []),
    ...(noCycle
      ? [
          {
            files: [`${root}/**/*.ts`],
            ignores: ['**/index.ts'],
            rules: { 'import-x/no-cycle': noCycleRule },
          },
        ]
      : []),
  ]
}
