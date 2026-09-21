import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { commentForm } from '../../../rules/comment-form.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TsdocOptions] = [{ commentWidth: 60, testFolder: '__tests__', frameworkSymbols: [] }]

/** Fourteen words, which run past the column the options set. */
const WORDS = 'word '.repeat(14).trim()

/** The same words, as the fix wraps them: eleven on the first line and three on the second. */
const WRAPPED_HEAD = 'word '.repeat(11).trim()
const WRAPPED_TAIL = 'word '.repeat(3).trim()

ruleTester.run('comment-form', commentForm, {
  valid: [
    // A note that follows code on the same line is the line's own, not a paragraph of its own.
    { code: 'const a = 1 // the count\nconst b = 2 // the other', options },

    { code: '// A note that fits on one line\nconst a = 1', options },
    { code: '/*\n * A note that runs to a paragraph, written as a block\n * comment.\n */\nconst a = 1', options },
    { code: '// @ts-expect-error the call is untyped\n// #region users\nconst a = 1', options },
  ],
  invalid: [
    // A run of three lines, written past the column, is one block once it is rewrapped.
    {
      code: `// ${WORDS}\n// and more words here\n// and still more\nconst a = 1`,
      options,
      errors: [{ messageId: 'lineRun' }],
      output: `/*\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL} and more words here and still more\n */\nconst a = 1`,
    },

    // A run written inside a block is rewrapped with the indentation it had.
    {
      code: `const read = () => {\n  // A note that runs\n  // across two lines\n  return 1\n}`,
      options,
      errors: [{ messageId: 'lineRun' }],
      output: `const read = () => {\n  /*\n   * A note that runs across two lines\n   */\n  return 1\n}`,
    },

    // A block comment past the column is rewrapped, and every paragraph of it survives the fix.
    {
      code: `/*\n * ${WORDS}\n *\n * A second paragraph.\n */\nconst a = 1`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/*\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL}\n *\n * A second paragraph.\n */\nconst a = 1`,
    },
    // A documentation comment keeps its second asterisk, and a tag opens a paragraph with no blank line above it.
    {
      code: `/**\n * ${WORDS}\n * @param value - The value.\n */\nconst read = value => value`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/**\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL}\n * @param value - The value.\n */\nconst read = value => value`,
    },
    {
      code: '// A note that runs\n// across two lines\nconst a = 1',
      options,
      errors: [{ messageId: 'lineRun' }],
      output: '/*\n * A note that runs across two lines\n */\nconst a = 1',
    },
    {
      code: `// ${'word '.repeat(14).trim()}\nconst a = 1`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/*\n * ${'word '.repeat(11).trim()}\n * ${'word '.repeat(3).trim()}\n */\nconst a = 1`,
    },
  ],
})

ruleTester.run('comment-form, on a directive the compiler reads', commentForm, {
  valid: [
    // A triple slash is a directive: rewrapped into a block, the reference leaves the program.
    {
      code: '/// <reference types="vitest/globals" />\n/// <reference types="@testing-library/jest-dom" />\n\nexport const a = 1',
      options,
    },
  ],
  invalid: [],
})
