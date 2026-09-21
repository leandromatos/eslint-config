import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { throwsTag } from '../../../rules/throws-tag.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TsdocOptions] = [{ commentWidth: 120, testFolder: '__tests__', frameworkSymbols: [] }]

ruleTester.run('throws-tag', throwsTag, {
  valid: [
    // A function that documents nothing, because nothing precedes it, carries no tag to check.
    { code: 'export const service = {\n  read: () => {\n    throw new NotFoundException()\n  },\n}', options },

    // A function declaration carries its comment on itself.
    {
      code: '/**\n * Reads one user.\n *\n * @throws NotFoundException When the user is not found.\n */\nfunction read() {\n  throw new NotFoundException()\n}',
      options,
    },
    // A throw of something that is not a construction says nothing about a type.
    { code: '/** Reads one user. */\nconst read = () => {\n  throw problem\n}', options },
    // A title that is neither a literal nor a property of the first argument is not a condition.
    {
      code: '/**\n * Reads one user.\n *\n * @throws NotFoundException\n */\nconst read = () => {\n  throw new NotFoundException({ code: 404 })\n}',
      options,
    },
    {
      code: '/**\n * Reads one user.\n *\n * @throws NotFoundException\n */\nconst read = () => {\n  throw new NotFoundException({ title })\n}',
      options,
    },
    {
      code: '/**\n * Reads one user.\n *\n * @throws NotFoundException\n */\nconst read = () => {\n  throw new NotFoundException(404)\n}',
      options,
    },

    {
      code: '/**\n * Reads one user.\n *\n * @throws NotFoundException When the user is not found.\n */\nconst read = () => {\n  throw new NotFoundException()\n}',
      options,
    },
    { code: 'const read = () => {\n  throw new NotFoundException()\n}', options },
    { code: '/** Reads one user. */\nconst read = () => 1', options },
    // A function nested inside another carries its own throws, not its parent's.
    {
      code: '/**\n * Reads one user.\n */\nconst read = () => {\n  const inner = () => {\n    throw new NotFoundException()\n  }\n\n  return inner\n}',
      options,
    },
  ],
  invalid: [
    // A comment that already ends with a tag takes the new one straight after it.
    {
      code: '/**\n * Reads one user.\n *\n * @param id - The ID of the user.\n */\nconst read = (id) => {\n  throw new NotFoundException()\n}',
      options,
      errors: [{ messageId: 'missingThrows' }],
      output:
        '/**\n * Reads one user.\n *\n * @param id - The ID of the user.\n * @throws NotFoundException\n */\nconst read = (id) => {\n  throw new NotFoundException()\n}',
    },

    // A method carries its comment on the declaration, and an internal error is thrown "When X fails."
    {
      code: "class UserService {\n  /**\n   * Reads one user.\n   */\n  findOneUser() {\n    throw new InternalServerErrorException({ title: 'Error while reading the user.' })\n  }\n}",
      options,
      errors: [{ messageId: 'missingThrows' }],
      output:
        "class UserService {\n  /**\n   * Reads one user.\n   *\n   * @throws InternalServerErrorException When reading the user fails.\n   */\n  findOneUser() {\n    throw new InternalServerErrorException({ title: 'Error while reading the user.' })\n  }\n}",
    },
    // An exported arrow carries its comment on the export, and a title written as a template keeps its placeholder.
    {
      code: '/**\n * Reads one user.\n */\nexport const read = () => {\n  throw new NotFoundException(`User ${id} not found.`)\n}',
      options,
      errors: [{ messageId: 'missingThrows' }],
      output:
        '/**\n * Reads one user.\n *\n * @throws NotFoundException User {value} not found.\n */\nexport const read = () => {\n  throw new NotFoundException(`User ${id} not found.`)\n}',
    },
    // A problem built without a literal title gets the tag alone, for a hand to finish.
    {
      code: '/**\n * Reads one user.\n */\nconst read = () => {\n  throw new NotFoundException(problem)\n}',
      options,
      errors: [{ messageId: 'missingThrows' }],
      output:
        '/**\n * Reads one user.\n *\n * @throws NotFoundException\n */\nconst read = () => {\n  throw new NotFoundException(problem)\n}',
    },
    {
      code: '/**\n * Reads one user.\n */\nconst read = () => {\n  throw new NotFoundException()\n}',
      options,
      errors: [{ messageId: 'missingThrows' }],
      output:
        '/**\n * Reads one user.\n *\n * @throws NotFoundException\n */\nconst read = () => {\n  throw new NotFoundException()\n}',
    },
    {
      code: '/**\n * Reads one user.\n *\n * @throws {NotFoundException} When the user is not found.\n */\nconst read = () => {\n  throw new NotFoundException()\n}',
      options,
      errors: [{ messageId: 'bracedThrows' }],
      output:
        '/**\n * Reads one user.\n *\n * @throws NotFoundException When the user is not found.\n */\nconst read = () => {\n  throw new NotFoundException()\n}',
    },
  ],
})
