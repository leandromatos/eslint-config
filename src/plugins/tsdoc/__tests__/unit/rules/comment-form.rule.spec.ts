import { createSyntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { commentForm } from '../../../rules/comment-form.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

const options: [TsdocOptions] = [{ ...EMPTY_OPTIONS, commentWidth: 60 }]

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

    // A run that fits on one line is one line comment, with the indentation it had.
    {
      code: `const read = () => {\n  // A note that runs\n  // across two lines\n  return 1\n}`,
      options,
      errors: [{ messageId: 'lineRun' }],
      output: `const read = () => {\n  // A note that runs across two lines\n  return 1\n}`,
    },
    // A run inside a block that runs to a paragraph is a block with the indentation it had.
    {
      code: `const read = () => {\n  // ${WORDS}\n  // and more\n  return 1\n}`,
      options,
      errors: [{ messageId: 'lineRun' }],
      output: `const read = () => {\n  /*\n   * ${WRAPPED_HEAD}\n   * ${WRAPPED_TAIL} and more\n   */\n  return 1\n}`,
    },

    // A block comment past the column is rewrapped, and every paragraph of it survives the fix.
    {
      code: `/*\n * ${WORDS}\n *\n * A second paragraph.\n */\nconst a = 1`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/*\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL}\n *\n * A second paragraph.\n */\nconst a = 1`,
    },
    /*
     * A documentation comment keeps its second asterisk. The first tag keeps a blank line above it, and a tag below
     * another tag carries none.
     */
    {
      code: `/**\n * ${WORDS}\n * @param value - The value.\n * @returns The value.\n */\nconst read = value => value`,
      options,
      errors: [{ messageId: 'pastWidth' }, { messageId: 'tagAgainstSummary' }],
      output: `/**\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL}\n *\n * @param value - The value.\n * @returns The value.\n */\nconst read = value => value`,
    },
    // A code span stays on one line, so a span that does not fit moves whole to the next.
    {
      code: `/*\n * ${'word '.repeat(10).trim()} \`one two\` end end\n */\nconst a = 1`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/*\n * ${'word '.repeat(10).trim()}\n * \`one two\` end end\n */\nconst a = 1`,
    },
    // A span that never closes keeps the rest of the paragraph with it.
    {
      code: `/*\n * ${'word '.repeat(10).trim()} \`one two end end\n */\nconst a = 1`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/*\n * ${'word '.repeat(10).trim()}\n * \`one two end end\n */\nconst a = 1`,
    },
    {
      code: '// A note that runs\n// across two lines\nconst a = 1',
      options,
      errors: [{ messageId: 'lineRun' }],
      output: '// A note that runs across two lines\nconst a = 1',
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

ruleTester.run('comment-form, between the summary and the first tag', commentForm, {
  valid: [
    {
      code: '/**\n * Reads one user.\n *\n * @param id - The user.\n * @returns The user.\n */\nconst read = id => id',
      options,
    },
    // A comment that opens with a tag carries no summary to separate, and a note is no documentation comment.
    { code: '/** {@inheritDoc Reader.read} */\nconst read = id => id', options },
    { code: '/**\n * @param id - The user.\n */\nconst read = id => id', options },
    { code: '/*\n * Reads one user.\n * @see the route\n */\nconst read = id => id', options },
    // A decorator in a fenced example is code, and the tag after the fence is separated.
    {
      code: '/**\n * Wires the module.\n * ```ts\n * @Module({})\n * ```\n *\n * @returns The module.\n */\nconst wire = () => 1',
      options,
    },
    { code: '/** Reads one user. */\nconst read = id => id', options },
  ],
  invalid: [
    {
      code: '/**\n * Reads one user.\n * @param id - The user.\n * @returns The user.\n */\nconst read = id => id',
      options,
      errors: [{ messageId: 'tagAgainstSummary' }],
      output:
        '/**\n * Reads one user.\n *\n * @param id - The user.\n * @returns The user.\n */\nconst read = id => id',
    },
    // A summary on the opening line runs into the tag the same way, and the fix keeps the indentation.
    {
      code: 'class Reader {\n  /** Reads one user.\n   * @returns The user.\n   */\n  read() {}\n}',
      options,
      errors: [{ messageId: 'tagAgainstSummary' }],
      output: 'class Reader {\n  /** Reads one user.\n   *\n   * @returns The user.\n   */\n  read() {}\n}',
    },
  ],
})

ruleTester.run('comment-form, rewrapping what a documentation comment holds', commentForm, {
  valid: [],
  invalid: [
    // A fenced example is code, and the rewrap keeps its lines and their indentation as written.
    {
      code: `/**\n * ${WORDS}\n *\n * @example\n * \`\`\`ts\n * const user = read({\n *   id: '1',\n * })\n * \`\`\`\n */\nconst read = value => value`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/**\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL}\n *\n * @example\n * \`\`\`ts\n * const user = read({\n *   id: '1',\n * })\n * \`\`\`\n */\nconst read = value => value`,
    },
    // A sentence written across two lines is joined back before it is wrapped again.
    {
      code: `/**\n * ${WORDS}\n * end\n */\nconst read = value => value`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/**\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL} end\n */\nconst read = value => value`,
    },
    // An inline tag is one word, so a link moves to the next line whole.
    {
      code: '/**\n * word word word word word word word word word {@link UserService | the service} end\n */\nconst read = value => value',
      options,
      errors: [{ messageId: 'pastWidth' }],
      output:
        '/**\n * word word word word word word word word word\n * {@link UserService | the service} end\n */\nconst read = value => value',
    },
    // A paragraph after a fence keeps the blank line it was written with, and one written against the fence keeps none.
    {
      code: `/**\n * ${WORDS}\n *\n * \`\`\`ts\n * read()\n * \`\`\`\n * Then it reads.\n *\n * And again.\n */\nconst read = value => value`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/**\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL}\n *\n * \`\`\`ts\n * read()\n * \`\`\`\n * Then it reads.\n *\n * And again.\n */\nconst read = value => value`,
    },
  ],
})

ruleTester.run('comment-form, a block note that fits on one line', commentForm, {
  valid: [
    // A documentation comment is for the caller and stays a block, however short.
    { code: '/** Reads one user. */\nconst read = () => 1', options },
    // A note beside code, or one that runs to a paragraph, stays a block.
    { code: 'const read = (/* the id */ id) => id', options },
    { code: '/*\n * Reads one user.\n * Then caches it.\n */\nconst read = () => 1', options },
    // A directive is the tool's.
    { code: '/* istanbul ignore next */\nconst read = () => 1', options },
    { code: '/*! A license the bundler keeps. */\nconst read = () => 1', options },
  ],
  invalid: [
    // A note of one line too long for the column is wrapped where it stands, and stays a block.
    {
      code: `/*\n * ${WORDS}\n */\nconst read = () => 1`,
      options,
      errors: [{ messageId: 'pastWidth' }],
      output: `/*\n * ${WRAPPED_HEAD}\n * ${WRAPPED_TAIL}\n */\nconst read = () => 1`,
    },
    {
      code: '/* The cache answers first. */\nconst read = () => 1',
      options,
      errors: [{ messageId: 'oneLineBlock' }],
      output: '// The cache answers first.\nconst read = () => 1',
    },
    {
      code: 'const read = () => {\n  /*\n   * The cache answers first.\n   */\n  return 1\n}',
      options,
      errors: [{ messageId: 'oneLineBlock' }],
      output: 'const read = () => {\n  // The cache answers first.\n  return 1\n}',
    },
  ],
})
