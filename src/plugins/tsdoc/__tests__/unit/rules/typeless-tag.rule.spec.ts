import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { typelessTag } from '../../../rules/typeless-tag.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TsdocOptions] = [{ commentWidth: 120, readsReleaseTags: false }]

ruleTester.run('typeless-tag', typelessTag, {
  valid: [
    { code: '/**\n * Reads.\n *\n * @param id - The ID.\n * @returns The user.\n */\nfunction read(id) {}', options },
    // `@throws` is the business of another rule, and any other tag is not read.
    { code: '/**\n * Reads.\n *\n * @throws {Error} When it fails.\n */\nfunction read() {}', options },
    { code: '/**\n * Reads.\n *\n * @typeParam {string} T - The type.\n */\nfunction read<T>() {}', options },
    { code: 'function read(id) {}', options },
  ],
  invalid: [
    // Every documentation comment is read, whatever it documents.
    {
      code: '/**\n * Holds it.\n *\n * @param {string} id - The ID.\n */\nconst limit = 1',
      options,
      errors: [{ messageId: 'typedTag', data: { tag: 'param' } }],
      output: '/**\n * Holds it.\n *\n * @param id - The ID.\n */\nconst limit = 1',
    },
    {
      code: '/**\n * Reads.\n *\n * @param {string} id - The ID.\n */\nfunction read(id) {}',
      options,
      errors: [{ messageId: 'typedTag', data: { tag: 'param' }, line: 4 }],
      output: '/**\n * Reads.\n *\n * @param id - The ID.\n */\nfunction read(id) {}',
    },
    {
      code: '/**\n * Reads.\n *\n * @returns {Promise<{ id: string }>} The user.\n */\nfunction read() {}',
      options,
      errors: [{ messageId: 'typedTag', data: { tag: 'returns' } }],
      output: '/**\n * Reads.\n *\n * @returns The user.\n */\nfunction read() {}',
    },
    // The aliases JSDoc writes carry no type either.
    {
      code: '/**\n * Reads.\n *\n * @return {number} The count.\n */\nfunction read() {}',
      options,
      errors: [{ messageId: 'typedTag', data: { tag: 'return' } }],
      output: '/**\n * Reads.\n *\n * @return The count.\n */\nfunction read() {}',
    },
    // A declared function, an interface method and a class are read.
    {
      code: '/**\n * Reads.\n *\n * @param {string} id - The ID.\n */\ndeclare function read(id: string): void',
      options,
      errors: [{ messageId: 'typedTag' }],
      output: '/**\n * Reads.\n *\n * @param id - The ID.\n */\ndeclare function read(id: string): void',
    },
    {
      code: 'interface Reader {\n  /**\n   * Reads.\n   *\n   * @returns {number} The count.\n   */\n  read(): number\n}',
      options,
      errors: [{ messageId: 'typedTag' }],
      output: 'interface Reader {\n  /**\n   * Reads.\n   *\n   * @returns The count.\n   */\n  read(): number\n}',
    },
    {
      code: '/**\n * Reads.\n *\n * @param {string} id - The ID.\n */\nclass Reader {}',
      options,
      errors: [{ messageId: 'typedTag' }],
      output: '/**\n * Reads.\n *\n * @param id - The ID.\n */\nclass Reader {}',
    },
    // A brace with no closing one still reads as a type, through the end of the tag.
    {
      code: '/**\n * Reads.\n *\n * @param {string id - The ID.\n */\nfunction read(id) {}',
      options,
      errors: [{ messageId: 'typedTag' }],
      output: null,
    },
  ],
})
