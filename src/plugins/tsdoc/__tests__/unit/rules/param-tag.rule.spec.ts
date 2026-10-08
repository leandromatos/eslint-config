import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { paramTag } from '../../../rules/param-tag.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TsdocOptions] = [{ commentWidth: 120, readsReleaseTags: false }]

ruleTester.run('param-tag', paramTag, {
  valid: [
    // Every parameter carries a tag, in order, with text.
    {
      code: '/**\n * Sums two numbers.\n *\n * @param left - The first.\n * @param right - The second.\n */\nconst sum = (left, right) => left + right',
      options,
    },
    // A function nothing documents is left alone.
    { code: 'const sum = (left, right) => left + right', options },
    // A comment a blank line away documents nothing.
    { code: '/** Sums two numbers. */\n\nconst sum = (left, right) => left + right', options },
    // A comment that opens with three asterisks is not a documentation comment.
    { code: '/*** Sums two numbers. */\nconst sum = (left, right) => left + right', options },
    { code: '/**\n * Reads a user.\n *\n * @param query - The query.\n */\nfunction readUser({ id }) {}', options },
    // A dotted name documents a property, and the order reads the names without a dot.
    {
      code: '/**\n * Reads a user.\n *\n * @param query - The query.\n * @param query.id - The ID.\n */\nfunction readUser({ id }) {}',
      options,
    },
    // `this` types the receiver and is not passed by the caller.
    { code: '/** Reads the receiver. */\nfunction read(this: Repository) {}', options },
    // A comment that inherits its documentation documents nothing here.
    { code: '/**\n * @inheritDoc\n */\nfunction read(id) {}', options },
    // The inline tag TSDoc defines inherits the parameters too, with its reference or without one.
    { code: '/** {@inheritDoc Reader.read} */\nfunction read(id) {}', options },
    { code: '/**\n * {@inheritDoc}\n */\nfunction read(id) {}', options },
    // A bare hyphen still reads as text.
    { code: '/**\n * Reads one.\n *\n * @param id -\n */\nfunction read(id) {}', options },
    // An optional name in brackets, with its default, names the parameter.
    { code: '/**\n * Reads one.\n *\n * @param [limit=10] - How many.\n */\nfunction read(limit = 10) {}', options },
    // A property of another type, or a function-typed one whose names match, is left alone.
    {
      code: 'interface Options {\n  /**\n   * The key.\n   *\n   * @param z - The z.\n   */\n  key: string\n}',
      options,
    },
    { code: 'interface Options {\n  key: string\n}', options },
    /*
     * A function that only a condition holds reaches the file, and a default inside a declaration belongs to the
     * declaration: neither takes the comment above.
     */
    { code: 'if ((handler = function (id) {})) {\n}', options },
    {
      code: '/**\n * Builds it.\n *\n * @param callback - What it calls.\n */\nfunction build(callback = (id) => id) {}',
      options,
    },
    // A destructured parameter carries one tag for the whole object, under any name.
    { code: '/**\n * Reads a user.\n *\n * @param params - The route.\n */\nfunction readUser({ id }) {}', options },
    // A setter, a method without a body and an interface method list their parameters too.
    {
      code: 'class Repository {\n  /**\n   * Sets the limit.\n   *\n   * @param value - How many.\n   */\n  set limit(value: number) {}\n}',
      options,
    },
    {
      code: 'abstract class Repository {\n  /**\n   * Reads one.\n   *\n   * @param id - The ID.\n   */\n  abstract read(id: string): void\n}',
      options,
    },
    {
      code: 'class Repository {\n  /**\n   * Reads one.\n   *\n   * @param id - The ID.\n   */\n  read(id: string): void\n  read(id: string) {}\n}',
      options,
    },
    {
      code: 'interface Options {\n  /**\n   * Builds it.\n   *\n   * @param error - What failed.\n   */\n  build: (error: unknown) => void\n}',
      options,
    },
    // A line comment between the documentation and the function keeps them together.
    { code: '/** Reads one. */\n// a note\nfunction read() {}', options },
    // A tag inside a code fence is text.
    { code: '/**\n * Reads one.\n *\n * ```ts\n * @param id\n * ```\n */\nfunction read() {}', options },
  ],
  invalid: [
    // A parameter with no tag.
    {
      code: '/** Sums two numbers. */\nconst sum = (left, right) => left + right',
      options,
      errors: [
        { messageId: 'missingParam', data: { name: 'left' } },
        { messageId: 'missingParam', data: { name: 'right' } },
      ],
    },
    // A rest parameter, a default and a parameter property are named like any other.
    {
      code: '/** Reads. */\nfunction read(limit = 1, ...rest) {}',
      options,
      errors: [
        { messageId: 'missingParam', data: { name: 'limit' } },
        { messageId: 'missingParam', data: { name: 'rest' } },
      ],
    },
    {
      code: 'class Service {\n  /** Builds it. */\n  constructor(private readonly repository: Repository) {}\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'repository' } }],
    },
    // A rest parameter that destructures carries a tag at its position, like any destructured one.
    {
      code: '/** Reads. */\nfunction read(...[first, second]) {}',
      options,
      errors: [{ messageId: 'missingDestructuredParam', data: { position: '1' } }],
    },
    // An object destructured as a rest parameter, or after a named one.
    {
      code: '/** Reads. */\nfunction read(...{ length }) {}',
      options,
      errors: [{ messageId: 'missingDestructuredParam', data: { position: '1' } }],
    },
    {
      code: '/** Reads. */\nfunction read(id, ...[first, , [second]]) {}',
      options,
      errors: [
        { messageId: 'missingParam', data: { name: 'id' } },
        { messageId: 'missingDestructuredParam', data: { position: '2' } },
      ],
    },
    // The comment sits on the export, the member, the return, the assignment, or right before an argument.
    {
      code: '/** Reads. */\nexport default function (id) {}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: 'class Controller {\n  /** Reads. */\n  @Get()\n  read(@Param() id: string) {}\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: 'const handlers = {\n  /** Reads. */\n  read: function (id) {},\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: 'function build() {\n  /** Reads. */\n  return (id) => id\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: '/** Reads. */\nmodule.exports = (id) => id',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: 'register(/** Reads. */ (id) => id)',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: '/** Reads. */\nconst read = ((id) => id) as Reader',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    // Any expression between the function and what holds it passes the comment down, unless it carries its own.
    {
      code: '/** Reads. */\nconst read = enabled && function (id) {}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: '/** Registers it. */\nregister(handler = function (id) {})',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: 'register(/** Reads. */ handler = function (id) {})',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: '/** Reads. */\nexport const read = (id) => id',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    // A declared function and, where the options name it, an interface method are asked too.
    {
      code: '/** Reads. */\ndeclare function read(id: string): void',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: 'interface Repository {\n  /** Reads. */\n  read(id: string): void\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    /*
     * Every function is asked: a destructured object, one typed by a literal, a setter, a method without a body, an
     * interface method, a component and a property typed as a function.
     */
    {
      code: '/** Reads a user. */\nfunction readUser({ id }) {}',
      options,
      errors: [{ messageId: 'missingDestructuredParam', data: { position: '1' } }],
    },
    {
      code: '/** Reads a user. */\nfunction readUser(query?: { id: string }) {}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'query' } }],
    },
    {
      code: 'class Repository {\n  /** Sets the limit. */\n  set limit(value: number) {}\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'value' } }],
    },
    {
      code: 'abstract class Repository {\n  /** Reads one. */\n  abstract read(id: string): void\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: 'class Repository {\n  /** Reads one. */\n  read(id: string): void\n  read(id: string) {}\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'id' } }],
    },
    {
      code: '/** Renders the card. */\nfunction Card(props) {}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'props' } }],
    },
    {
      code: 'interface Options {\n  /** Builds it. */\n  build: (error: unknown) => void\n}',
      options,
      errors: [{ messageId: 'missingParam', data: { name: 'error' } }],
    },
    // A name past the last parameter.
    {
      code: '/**\n * Reads.\n *\n * @param id - The ID.\n * @param limit - How many.\n */\nfunction read(id) {}',
      options,
      errors: [{ messageId: 'unknownParam', data: { name: 'limit' } }],
    },
    // Names out of order are reported once, with both lists.
    {
      code: '/**\n * Sums.\n *\n * @param right - The second.\n * @param left - The first.\n */\nfunction sum(left, right) {}',
      options,
      errors: [{ messageId: 'paramOrder', data: { got: 'right, left', expected: 'left, right' } }],
    },
    // The list spreads a rest parameter, and takes the tag's name at a destructured position.
    {
      code: '/**\n * Reads.\n *\n * @param id - The ID.\n * @param others - The others.\n */\nfunction read(id, ...rest) {}',
      options,
      errors: [
        { messageId: 'paramOrder', data: { got: 'id, others', expected: 'id, ...rest' } },
        { messageId: 'missingParam', data: { name: 'rest' } },
      ],
    },
    {
      code: '/**\n * Reads.\n *\n * @param query - The query.\n */\nfunction read(id, { limit }) {}',
      options,
      errors: [
        { messageId: 'paramOrder', data: { got: 'query', expected: 'id, ' } },
        { messageId: 'missingParam', data: { name: 'id' } },
        { messageId: 'missingDestructuredParam', data: { position: '2' } },
      ],
    },
    // An interface method compares names and asks for every parameter.
    {
      code: 'interface Repository {\n  /**\n   * Reads.\n   *\n   * @param key - The key.\n   */\n  read(id: string): void\n}',
      options,
      errors: [
        { messageId: 'paramOrder', data: { got: 'key', expected: 'id' } },
        { messageId: 'missingParam', data: { name: 'id' } },
      ],
    },
    // A property typed as a function is asked for its parameters as a method is.
    {
      code: 'interface Options {\n  /**\n   * Builds it.\n   *\n   * @param key - The key.\n   */\n  build?: (error: unknown) => void\n}',
      options,
      errors: [
        { messageId: 'paramOrder', data: { got: 'key', expected: 'error' } },
        { messageId: 'missingParam', data: { name: 'error' } },
      ],
    },
    // A name written twice, dotted or not, is reported before anything else.
    {
      code: '/**\n * Reads.\n *\n * @param id - The ID.\n * @param id - The ID again.\n */\nfunction read(id) {}',
      options,
      errors: [{ messageId: 'duplicateParam', data: { name: 'id' } }],
    },
    // A tag with no text, dotted or not.
    {
      code: '/**\n * Reads.\n *\n * @param query - The query.\n * @param query.id\n */\nfunction read({ id }) {}',
      options,
      errors: [{ messageId: 'missingParamDescription', data: { name: 'query.id' } }],
    },
    // A tag with no name.
    {
      code: '/**\n * Reads.\n *\n * @param\n */\nfunction read(id) {}',
      options,
      errors: [
        { messageId: 'paramOrder', data: { got: '', expected: 'id' } },
        { messageId: 'missingParam', data: { name: 'id' } },
        { messageId: 'missingParamDescription', data: { name: '' } },
      ],
    },
    // A setter compares its names, asks for every parameter and for text.
    {
      code: 'class Repository {\n  /**\n   * Sets the limit.\n   *\n   * @param limit\n   */\n  set limit(value: number) {}\n}',
      options,
      errors: [
        { messageId: 'paramOrder', data: { got: 'limit', expected: 'value' } },
        { messageId: 'missingParam', data: { name: 'value' } },
        { messageId: 'missingParamDescription', data: { name: 'limit' } },
      ],
    },
    // A name in brackets with no closing bracket still reads as the name.
    {
      code: '/**\n * Reads.\n *\n * @param [limit=10\n */\nfunction read(id) {}',
      options,
      errors: [
        { messageId: 'paramOrder', data: { got: 'limit', expected: 'id' } },
        { messageId: 'missingParam', data: { name: 'id' } },
        { messageId: 'missingParamDescription', data: { name: 'limit' } },
      ],
    },
  ],
})
