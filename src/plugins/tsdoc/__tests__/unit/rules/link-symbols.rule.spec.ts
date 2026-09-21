import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { linkSymbols } from '../../../rules/link-symbols.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TsdocOptions] = [{ commentWidth: 120, testFolder: '__tests__', frameworkSymbols: [] }]
const source = sourceFile('users', 'services', 'user.service.ts')

ruleTester.run('link-symbols', linkSymbols, {
  valid: [
    // A class body that holds something other than a named member names nothing either.
    {
      code: 'class UserService {\n  /** Reads through {@link findOneUser}. */\n  read() {}\n\n  static {}\n\n  findOneUser() {}\n}',
      filename: source,
      options,
    },

    // A member under a computed key names nothing a link could resolve to.
    {
      code: 'class UserService {\n  /** Reads through `findOneUser`. */\n  read() {}\n\n  [key]() {}\n}',
      filename: source,
      options,
    },

    // A link whose head names a symbol in scope resolves, member and all.
    { code: '/** Reads {@link UserEntity.id}, the key. */\nexport class UserEntity {}', filename: source, options },

    // A link to an anchor of a package, and one to a name the file imports, resolve outside this file.
    { code: '/** See {@link guide#usage}. */\nexport const read = () => 1', filename: source, options },

    // A note and a documentation comment are told apart, and a link to a member of a class resolves.
    { code: '// Reads a `UserEntity`.\nexport class UserEntity {}', filename: source, options },
    { code: '/* Reads a `UserEntity`. */\nexport class UserEntity {}', filename: source, options },
    // A link that names a member of a symbol resolves by its head.
    { code: '/** Reads {@link UserEntity.id}. */\nexport class UserEntity {}', filename: source, options },

    // A member of the class the comment sits in resolves, and a word in prose is left alone.
    {
      code: 'class UserService {\n  /** Reads through {@link findOneUser}. */\n  read() {\n    return this.findOneUser()\n  }\n\n  findOneUser() {}\n}',
      filename: source,
      options,
    },
    // A link to a package, and one to an anchor, are not names in this file.
    { code: '/** See {@link @nestjs/common}. */\nexport const read = () => 1', filename: source, options },

    { code: '/** Reads a {@link UserEntity}. */\nexport class UserEntity {}', filename: source, options },
    { code: '/** Holds `id`, which is a key. */\nexport const read = () => 1', filename: source, options },
    { code: '/** See {@link https://example.com}. */\nexport const read = () => 1', filename: source, options },
    { code: '/** Reads a `UserEntity`. */\nexport class UserEntity {}', filename: 'scripts/read.ts', options },
  ],
  invalid: [
    // A member of the class the comment sits in is linked, and a backticked one is reported.
    {
      code: 'class UserService {\n  /** Reads through `findOneUser`. */\n  read() {\n    return this.findOneUser()\n  }\n\n  findOneUser() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'symbolInBackticks' }],
      output:
        'class UserService {\n  /** Reads through {@link findOneUser}. */\n  read() {\n    return this.findOneUser()\n  }\n\n  findOneUser() {}\n}',
    },

    {
      code: '/** Reads a `UserEntity`. */\nexport class UserEntity {}',
      filename: source,
      options,
      errors: [{ messageId: 'symbolInBackticks' }],
      output: '/** Reads a {@link UserEntity}. */\nexport class UserEntity {}',
    },
    {
      code: '/** Reads a {@link MissingEntity}. */\nexport const read = () => 1',
      filename: source,
      options,
      errors: [{ messageId: 'linkToNothing' }],
    },
  ],
})
