/**
 * Where a repository keeps its sources: its own `src/`, and the `src/` of each package one level under a workspace
 * folder, so a monorepo or a serverless repository is read without naming its packages.
 */
export const SOURCE_ROOTS = ['src', '{apps,libs,packages}/*/src']

/** The TypeScript files under every source root. */
export const TS_SOURCES = SOURCE_ROOTS.map(root => `${root}/**/*.ts`)

/** The TypeScript files under every source root, components included. */
export const TSX_SOURCES = SOURCE_ROOTS.map(root => `${root}/**/*.{ts,tsx}`)

/** The files `strict` and the plugin judge when a project names none: the TypeScript of every source root. */
export const DEFAULT_FILES = TS_SOURCES
