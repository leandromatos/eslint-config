import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { throwsTag } from '../../../rules/throws-tag.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TsdocOptions] = [{ commentWidth: 120, readsReleaseTags: false }]

ruleTester.run('throws-tag', throwsTag, {
  valid: [
    // A type, qualified or not, opens the tag, and the condition after it opens with a capital.
    {
      code: "import { Errors } from './errors.js'\n\n/**\n * Reads one user.\n *\n * @throws Errors.NotFound When the user is missing.\n */\nconst read = () => 1",
      options,
    },
    { code: '/**\n * Reads one user.\n *\n * @throws TypeError\n */\nconst read = () => 1', options },
    // A type the runtime declares, one the file imports and one named the way an error is, whatever the condition says.
    {
      code: '/**\n * Reads one user.\n *\n * @throws Error when the user is missing.\n */\nconst read = () => 1',
      options,
    },
    {
      code: "import { Problem } from './problem.js'\n\n/**\n * Reads one user.\n *\n * @throws Problem if the user is missing.\n */\nexport const read = () => 1",
      options,
    },
    {
      code: '/**\n * Reads one user.\n *\n * @throws UnauthorizedException if the user is missing.\n */\nconst read = () => 1',
      options,
    },
    // What a try throws stops at a catch that answers it with another error, which is the one that leaves.
    {
      code: '/**\n * Sends the mail.\n *\n * @throws MailNotSentError When the provider refuses it.\n */\nconst send = () => {\n  try {\n    throw new ProviderError()\n  } catch (error) {\n    throw new MailNotSentError()\n  }\n}',
      options,
    },
    // A catch with no binding, or one that swallows the error, keeps what the try throws in.
    {
      code: '/** Sends the mail. */\nconst send = () => {\n  try {\n    throw new ProviderError()\n  } catch {\n    return null\n  }\n}',
      options,
    },
    {
      code: '/** Sends the mail. */\nconst send = () => {\n  try {\n    throw new ProviderError()\n  } catch (error) {\n    const report = () => {\n      throw error\n    }\n    return report\n  } finally {\n    close()\n  }\n}',
      options,
    },
    // A value thrown on without a type to name is unknown, which TypeScript calls it.
    {
      code: "/**\n * Runs the hook.\n *\n * @throws unknown Whatever the caller's onError throws, thrown on as it was.\n */\nconst run = () => 1",
      options,
    },
    // A type a namespace qualifies is read whole, whatever the case of the namespace.
    {
      code: "import { errors } from 'oidc-provider'\n\n/**\n * Exchanges the grant.\n *\n * @throws errors.InvalidGrant When the code was already spent.\n */\nexport const exchange = () => {\n  throw new errors.InvalidGrant()\n}",
      options,
    },
    {
      code: '/**\n * Exchanges the grant.\n *\n * @throws oidc.errors.InvalidGrant\n */\nconst exchange = () => 1',
      options,
    },
    // A word that only contains the tag's name is no tag.
    { code: '/** Reads one user, and documents its failures with `@throws`. */\nconst read = () => 1', options },
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
    // A qualified word whose last segment is no type, such as an abbreviation, names none.
    {
      code: '/**\n * Exchanges the grant.\n *\n * @throws e.g. when the code was spent.\n */\nconst exchange = () => 1',
      options,
      errors: [{ messageId: 'untypedThrows' }],
    },
    // A word that only opens with the name of the type is no type.
    {
      code: '/**\n * Runs the hook.\n *\n * @throws unknownly when it fails.\n */\nconst run = () => 1',
      options,
      errors: [{ messageId: 'untypedThrows' }],
    },
    // A catch that throws the error on lets what the try throws leave, and a finally keeps nothing in.
    {
      code: '/** Sends the mail. */\nconst send = () => {\n  try {\n    throw new ProviderError()\n  } catch (error) {\n    log(error)\n    throw error\n  }\n}',
      options,
      errors: [{ messageId: 'missingThrows', data: { type: 'ProviderError' } }],
      output:
        '/**\n * Sends the mail.\n *\n * @throws ProviderError\n */\nconst send = () => {\n  try {\n    throw new ProviderError()\n  } catch (error) {\n    log(error)\n    throw error\n  }\n}',
    },
    {
      code: '/** Sends the mail. */\nconst send = () => {\n  try {\n    throw new ProviderError()\n  } finally {\n    close()\n  }\n}',
      options,
      errors: [{ messageId: 'missingThrows', data: { type: 'ProviderError' } }],
      output:
        '/**\n * Sends the mail.\n *\n * @throws ProviderError\n */\nconst send = () => {\n  try {\n    throw new ProviderError()\n  } finally {\n    close()\n  }\n}',
    },
    // A capital opens a sentence as well as a type, and a word nothing declares names no type.
    {
      code: '/**\n * Reads one user.\n *\n * @throws The error, unless it is the one a rollback raises.\n */\nconst read = () => 1',
      options,
      errors: [{ messageId: 'untypedThrows' }],
    },
    // A tag that opens with a sentence names no type a caller can catch.
    {
      code: '/**\n * Reads one user.\n *\n * @throws Will throw an error when the user is missing.\n */\nconst read = () => 1',
      options,
      errors: [{ messageId: 'untypedThrows', data: { text: ' Will throw an error when the user is missing.' } }],
    },
    {
      code: '/**\n * Reads one user.\n *\n * @throws\n */\nconst read = () => 1',
      options,
      errors: [{ messageId: 'untypedThrows' }],
    },
    {
      code: '/**\n * Reads one user.\n *\n * @throws when the user is missing.\n */\nconst read = () => 1',
      options,
      errors: [{ messageId: 'untypedThrows' }],
    },
    // The hyphen of a @param has no place after the type, with a condition or without one.
    {
      code: '/**\n * Reads one user.\n *\n * @throws NotFoundException - When the user is missing.\n */\nconst read = () => {\n  throw new NotFoundException()\n}',
      options,
      errors: [{ messageId: 'hyphenatedThrows', data: { type: 'NotFoundException' } }],
      output:
        '/**\n * Reads one user.\n *\n * @throws NotFoundException When the user is missing.\n */\nconst read = () => {\n  throw new NotFoundException()\n}',
    },
    {
      code: "import { Errors } from './errors.js'\n\n/**\n * Reads one user.\n *\n * @throws Errors.NotFound -\n */\nconst read = () => 1",
      options,
      errors: [{ messageId: 'hyphenatedThrows', data: { type: 'Errors.NotFound' } }],
      output:
        "import { Errors } from './errors.js'\n\n/**\n * Reads one user.\n *\n * @throws Errors.NotFound\n */\nconst read = () => 1",
    },
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
