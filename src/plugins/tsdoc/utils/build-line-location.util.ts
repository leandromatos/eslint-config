import type { TSESTree } from '@typescript-eslint/utils'

/**
 * The span of one line of the file, from its start, which is where a tag of a comment is reported.
 *
 * @param line - The line.
 * @returns The location.
 */
export const buildLineLocation = (line: number): TSESTree.SourceLocation => {
  const start = { line, column: 0 }
  const end = { line, column: 0 }

  return { start, end }
}
