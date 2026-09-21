import type { Linter } from 'eslint'
import type { ConfigArray } from 'typescript-eslint'

/**
 * One entry of a flat configuration assembled from this package.
 *
 * A consumer annotates its own array with `Config[]`. Without the annotation TypeScript infers the array's type from
 * `typescript-eslint`, `eslint` and `@eslint/core`, and a project that cannot name those packages fails with TS2883,
 * "the inferred type of 'default' cannot be named". That is any project on pnpm, where a transitive dependency lives
 * under `.pnpm/` and has no name the consumer can write. Re-exporting the union from here gives the annotation a name
 * every consumer already has.
 *
 * `defineConfig` from `eslint/config` does not take this type. It reads a config entry as `@eslint/core` describes
 * one, and a rule of this package is typed as `typescript-eslint` describes one, so that it can read a TypeScript
 * node and its own options. The two spell `languageOptions` differently and neither is wrong. A project that wants
 * `extends` wraps only the entry that uses it:
 *
 * ```ts
 * const eslintConfig: Config[] = [
 *   ...configs.nextjs(),
 *   ...defineConfig([{ files: ['src/**\/*.tsx'], extends: [somePolicy] }]),
 * ]
 * ```
 */
export type Config = ConfigArray[number] | Linter.Config

/**
 * What a project says to the `recommended` tier on top of the defaults.
 *
 * The base layer judges every file a project holds rather than its sources alone, so what a project states here is
 * what the linter never reads. A project on a stricter tier passes the same field to that one instead, and the tier
 * carries it down.
 */
export interface RecommendedOptions {
  /** Files the linter never reads, beyond the ones every project ignores. */
  ignores?: string[]
}
