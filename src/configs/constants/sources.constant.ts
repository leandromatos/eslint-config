/**
 * Where a repository keeps its sources: its own `src/`, and the `src/` of each package one level under a workspace
 * folder, so a monorepo or a serverless repository is read without naming its packages.
 */
export const SOURCE_ROOTS = ['src', '{apps,libs,packages}/*/src']

/**
 * The scripts a repository keeps at its root, which are code the project writes as much as its sources, written as a
 * module of either kind, `.ts` or `.mts`. The configuration files at the root stay out: each tool names its own and
 * reads it.
 */
const SCRIPTS_FOLDER = 'scripts'

/** The TypeScript files under every source root, and the scripts of the repository. */
export const TS_SOURCES = [...SOURCE_ROOTS.map(root => `${root}/**/*.ts`), `${SCRIPTS_FOLDER}/**/*.{ts,mts}`]

/** The TypeScript files under every source root, components included, and the scripts of the repository. */
export const TSX_SOURCES = [...SOURCE_ROOTS.map(root => `${root}/**/*.{ts,tsx}`), `${SCRIPTS_FOLDER}/**/*.{ts,mts,tsx}`]

/**
 * The files `strict` and the plugin judge when a project names none: the TypeScript of every source root, and the
 * scripts of the repository.
 */
export const DEFAULT_FILES = TS_SOURCES
