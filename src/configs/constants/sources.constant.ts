import { AGNOSTIC_SUFFIX_DICTIONARY } from './suffix-dictionary.constant.js'

/**
 * Where a repository keeps its sources: its own `src/`, and the `src/` of each package one level under a workspace
 * folder, so a monorepo or a serverless repository is read without naming its packages.
 */
export const SOURCE_ROOTS = ['src', '{apps,libs,packages}/*/src']

/**
 * The TypeScript files under every source root, and the scripts at the root of the repository, which are code the
 * project writes as much as its sources. The configuration files at the root stay out: each tool reads its own.
 */
export const TS_SOURCES = [
  ...SOURCE_ROOTS.map(root => `${root}/**/*.ts`),
  `${AGNOSTIC_SUFFIX_DICTIONARY.script}/**/*.{ts,mts}`,
]

/** The TypeScript files under every source root, components included, and the scripts of the repository. */
export const TSX_SOURCES = [
  ...SOURCE_ROOTS.map(root => `${root}/**/*.{ts,tsx}`),
  `${AGNOSTIC_SUFFIX_DICTIONARY.script}/**/*.{ts,mts,tsx}`,
]
