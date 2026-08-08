export function importBoundaries({
  suffixToFolder,
  root,
  alias,
  mirrorFolders,
  testFolder,
  noCycle,
}: ImportBoundariesOptions): import('eslint').Linter.Config[]
export default importBoundaries
/**
 * Options accepted by {@link importBoundaries}.
 */
export type ImportBoundariesOptions = {
  /**
   * Layer suffix to the folder that
   * holds it, such as `{ entity: 'entities', service: 'services' }`. Required, and the
   * only place the project's vocabulary lives: the package ships no default map,
   * because a default would be one framework's convention imposed on every project.
   */
  suffixToFolder: Record<string, string>
  /**
   * Source directory to walk, relative to the ESLint working
   * directory. Defaults to `src`.
   */
  root?: string | undefined
  /**
   * Path alias that maps to the root. Defaults to `@`.
   */
  alias?: string | undefined
  /**
   * Folders that mirror the layer structure without
   * being layers — with `types` listed, `roles/types/entities` holds `*.type.ts`, not
   * `*.entity.ts`. Defaults to none.
   */
  mirrorFolders?: string[] | undefined
  /**
   * Folder holding test files, such as `__tests__`. When
   * set, production code cannot import from it, and the layer that folder maps to is
   * exempt, since tests reaching other tests is expected. Defaults to no such rule.
   */
  testFolder?: string | undefined
  /**
   * Whether to add `import-x/no-cycle`. Defaults to `true`.
   */
  noCycle?: boolean | undefined
}
