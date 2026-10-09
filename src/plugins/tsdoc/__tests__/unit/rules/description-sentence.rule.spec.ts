import { createSyntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { descriptionSentence } from '../../../rules/description-sentence.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

const options: [TsdocOptions] = [{ ...EMPTY_OPTIONS, commentWidth: 120 }]

ruleTester.run('description-sentence', descriptionSentence, {
  valid: [
    // A capital is a capital in any script, so a sentence opening on an accented letter opens on one.
    { code: '/** Ótimo. */\nfunction read() {}', options },
    // The sentence of a throws tag is the condition after its type, which may open in lower case.
    {
      code: '/**\n * Runs.\n *\n * @throws unknown Whatever the hook throws, as it was.\n */\nfunction run() {}',
      options,
    },
    {
      code: '/**\n * Runs.\n *\n * @throws errors.InvalidGrant When the code was spent.\n * @throws Error\n */\nfunction run() {}',
      options,
    },
    // A comment that inherits its documentation takes its summary from there.
    { code: '/** {@inheritDoc Reader.read} */\nfunction read(id) {}', options },
    // A sentence, with sentences in its tags.
    {
      code: '/**\n * Reads a user.\n *\n * @param id - The ID of the user.\n * @returns The user.\n * @throws NotFoundException When no user has the ID.\n */\nfunction read(id) {}',
      options,
    },
    /*
     * A sentence may open with a digit, an underscore or a backtick, and close with a question, an exclamation, a
     * backtick or an emoji.
     */
    { code: '/** 3 users at most. */\nfunction read() {}', options },
    { code: '/** _Private_ reader. */\nfunction read() {}', options },
    { code: '/** `read` reads it? */\nfunction read() {}', options },
    { code: '/** It reads! */\nfunction read() {}', options },
    { code: '/** It reads `fast` */\nfunction read() {}', options },
    { code: '/** It reads ✅ */\nfunction read() {}', options },
    // A description that closes on a code fence.
    { code: '/**\n * Reads it:\n *\n * ```ts\n * read()\n * ```\n */\nfunction read() {}', options },
    // Nothing at all, and a tag that carries no text or a bare hyphen.
    { code: '/**\n * @returns The user.\n */\nfunction read() {}', options },
    { code: '/**\n * Reads.\n *\n * @param id -\n */\nfunction read(id) {}', options },
    // Text in another tag is not read.
    { code: '/**\n * Reads.\n *\n * @remarks lowercase remark\n */\nfunction read() {}', options },
    // A class, a variable and an interface method are not read.
    { code: '/** lowercase class */\nclass Reader {}', options },
    { code: '/** lowercase value */\nconst limit = 1', options },
    // A function nothing documents.
    { code: 'function read() {}', options },
    // A property that holds no function is a value.
    { code: 'interface Options {\n  /** lowercase value */\n  limit: number\n}', options },
  ],
  invalid: [
    {
      code: '/**\n * Runs.\n *\n * @throws errors.InvalidGrant when the code was spent\n */\nfunction run() {}',
      options,
      errors: [{ messageId: 'notSentence', data: { part: 'text of @throws' } }],
    },
    // The tags a comment writes beside the inherited summary are its own, and read as any other.
    {
      code: '/**\n * {@inheritDoc Reader.read}\n *\n * @throws NotFoundException when nobody has it\n */\nfunction read(id) {}',
      options,
      errors: [{ messageId: 'notSentence', data: { part: 'text of @throws' } }],
    },
    // A method without a body, an interface method and a property typed as a function read as a function does.
    {
      code: 'interface Reader {\n  /** lowercase method */\n  read(): void\n}',
      options,
      errors: [{ messageId: 'notSentence', data: { part: 'description' } }],
    },
    {
      code: 'abstract class Reader {\n  /** lowercase method */\n  abstract read(): void\n}',
      options,
      errors: [{ messageId: 'notSentence', data: { part: 'description' } }],
    },
    {
      code: 'interface Options {\n  /** lowercase callback */\n  build: () => void\n}',
      options,
      errors: [{ messageId: 'notSentence', data: { part: 'description' } }],
    },
    {
      code: '/** reads a user. */\nfunction read() {}',
      options,
      errors: [{ messageId: 'notSentence', data: { part: 'description' }, line: 1 }],
    },
    {
      code: '/** Reads a user */\nfunction read() {}',
      options,
      errors: [{ messageId: 'notSentence', data: { part: 'description' } }],
    },
    // A sentence that closes on a link or a parenthesis, or opens with a quote, an accent or a link, does not read.
    { code: '/** See {@link Reader} */\nfunction read() {}', options, errors: [{ messageId: 'notSentence' }] },
    { code: '/** Reads (fast.) */\nfunction read() {}', options, errors: [{ messageId: 'notSentence' }] },
    { code: '/** "Reads" a user. */\nfunction read() {}', options, errors: [{ messageId: 'notSentence' }] },
    // The last line of a description is what closes it.
    {
      code: '/**\n * Reads a user.\n *\n * second paragraph\n */\nfunction read() {}',
      options,
      errors: [{ messageId: 'notSentence', line: 2 }],
    },
    // The text of each sentence tag, on its own line; a type in braces is not part of the text.
    {
      code: '/**\n * Reads.\n *\n * @param id - the ID.\n * @returns The user\n * @throws when nobody has it\n */\nfunction read(id) {}',
      options,
      errors: [
        { messageId: 'notSentence', data: { part: 'text of @param' }, line: 4 },
        { messageId: 'notSentence', data: { part: 'text of @returns' }, line: 5 },
        { messageId: 'notSentence', data: { part: 'text of @throws' }, line: 6 },
      ],
    },
    // A `@throws` keeps its hyphen, so a hyphen opens its text.
    {
      code: '/**\n * Reads.\n *\n * @throws {Error} - When it fails.\n */\nfunction read() {}',
      options,
      errors: [{ messageId: 'notSentence', line: 4 }],
    },
    // A method, a setter, a constructor and a declared function are read.
    {
      code: 'class Reader {\n  /** reads */\n  read() {}\n  /** sets */\n  set limit(value) {}\n  /** builds */\n  constructor() {}\n}',
      options,
      errors: [{ messageId: 'notSentence' }, { messageId: 'notSentence' }, { messageId: 'notSentence' }],
    },
    { code: '/** reads */\ndeclare function read(): void', options, errors: [{ messageId: 'notSentence' }] },
  ],
})
