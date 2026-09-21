import type { ESLint } from 'eslint'

/**
 * The one result a single-file lint produced.
 *
 * ESLint answers a list whatever it was handed, so the single result reads as optional; an empty list means the file
 * was ignored by the configuration under test, and failing here says that rather than the assertion below.
 *
 * @param lintResults - What ESLint answered.
 * @param label - What was linted, for the failure.
 * @returns The result.
 * @throws Error When ESLint returned no result.
 */
export const firstLintResult = (lintResults: ESLint.LintResult[], label: string): ESLint.LintResult => {
  const [lintResult] = lintResults
  if (!lintResult) throw new Error(`ESLint returned no result for "${label}"`)

  return lintResult
}
