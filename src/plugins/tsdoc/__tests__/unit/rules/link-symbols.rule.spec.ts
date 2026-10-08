import { packageSourceFile, sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { linkSymbols } from '../../../rules/link-symbols.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TsdocOptions] = [{ commentWidth: 120, readsReleaseTags: false }]
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

ruleTester.run('link-symbols, in a repository of several packages', linkSymbols, {
  valid: [],
  invalid: [
    // A declaration is documented wherever it sits, so a file with no `src` in its path is judged too.
    {
      code: '/** Reads a `UserEntity`. */\nexport class UserEntity {}',
      filename: '.rnstorybook/utils/story-users.util.ts',
      options,
      errors: [{ messageId: 'symbolInBackticks' }],
      output: '/** Reads a {@link UserEntity}. */\nexport class UserEntity {}',
    },
    {
      code: '/** Reads a `UserEntity`. */\nexport class UserEntity {}',
      filename: packageSourceFile('packages/x', 'users', 'services', 'user.service.ts'),
      options,
      errors: [{ messageId: 'symbolInBackticks' }],
      output: '/** Reads a {@link UserEntity}. */\nexport class UserEntity {}',
    },
  ],
})

ruleTester.run('link-symbols, on a name TSDoc keeps as a selector', linkSymbols, {
  valid: [
    // The quoted forms parse, and each resolves to what it names.
    { code: 'class Activity {\n  type = 1\n\n  /** Reads {@link Activity."type"}. */\n  read() {}\n}', options },
    { code: 'const type = 1\n/** Reads {@link "type"}. */\nexport const read = () => type', options },
    // A member of a class with no name cannot be qualified, so code font is the only way to write it.
    { code: 'export const Activity = class {\n  type = 1\n\n  /** Reads `type`. */\n  read() {}\n}', options },
  ],
  invalid: [
    {
      code: 'class Activity {\n  type = 1\n\n  /** Reads `type`. */\n  read() {}\n}',
      options,
      errors: [{ messageId: 'symbolInBackticks', data: { name: 'type', target: 'Activity."type"' } }],
      output: 'class Activity {\n  type = 1\n\n  /** Reads {@link Activity."type"}. */\n  read() {}\n}',
    },
    {
      code: 'const type = 1\n/** Reads `type`. */\nexport const read = () => type',
      options,
      errors: [{ messageId: 'symbolInBackticks', data: { name: 'type', target: '"type"' } }],
      output: 'const type = 1\n/** Reads {@link "type"}. */\nexport const read = () => type',
    },
    {
      code: 'class Activity {\n  type = 1\n\n  /** Reads {@link type}. */\n  read() {}\n}',
      options,
      errors: [{ messageId: 'unquotedSelector', data: { name: 'type', target: 'Activity."type"' } }],
      output: 'class Activity {\n  type = 1\n\n  /** Reads {@link Activity."type"}. */\n  read() {}\n}',
    },
    {
      code: 'class Activity {\n  type = 1\n}\n/** Reads {@link Activity.type | the type}. */\nexport const read = () => 1',
      options,
      errors: [{ messageId: 'unquotedSelector', data: { name: 'type', target: 'Activity."type"' } }],
      output:
        'class Activity {\n  type = 1\n}\n/** Reads {@link Activity."type" | the type}. */\nexport const read = () => 1',
    },
    // A lone selector the scope binds is quoted, and so is one a class with no name holds, which nothing qualifies.
    {
      code: 'const type = 1\n/** Reads {@link type}. */\nexport const read = () => type',
      options,
      errors: [{ messageId: 'unquotedSelector' }],
      output: 'const type = 1\n/** Reads {@link "type"}. */\nexport const read = () => type',
    },
    {
      code: 'export const Activity = class {\n  type = 1\n\n  /** Reads {@link type}. */\n  read() {}\n}',
      options,
      errors: [{ messageId: 'unquotedSelector' }],
      output: 'export const Activity = class {\n  type = 1\n\n  /** Reads {@link "type"}. */\n  read() {}\n}',
    },
  ],
})
