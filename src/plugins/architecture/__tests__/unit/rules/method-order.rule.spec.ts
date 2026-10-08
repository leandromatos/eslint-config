import { packageSourceFile, sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { methodOrder } from '../../../rules/method-order.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [ArchitectureOptions] = [{ ...EMPTY_OPTIONS, orderedSuffixes: ['service'] }]
const service = sourceFile('users', 'services', 'user.service.ts')

ruleTester.run('method-order', methodOrder, {
  valid: [
    // A member that is not a method, and a method under a computed key, are not part of the order.
    { code: 'class UserService {\n  readonly limit = 10\n\n  createUser() {}\n}', filename: service, options },
    { code: 'class UserService {\n  [key]() {}\n\n  createUser() {}\n}', filename: service, options },

    {
      code: 'class UserService {\n  createUser() {}\n\n  findOneUser() {}\n\n  private readUser() {}\n}',
      filename: service,
      options,
    },
    {
      code: 'class UserService {\n  findOneUser() {}\n\n  createUser() {}\n}',
      filename: sourceFile('users', 'repositories', 'user.repository.ts'),
      options,
    },
  ],
  invalid: [
    // A documentation comment travels with the method the fix moves.
    {
      code: 'class UserService {\n  /** Reads one user. */\n  findOneUser() {}\n\n  /** Creates one user. */\n  createUser() {}\n}',
      filename: service,
      options,
      errors: [{ messageId: 'outOfOrder' }],
      output:
        'class UserService {\n  /** Creates one user. */\n  createUser() {}\n\n  /** Reads one user. */\n  findOneUser() {}\n}',
    },

    {
      code: 'class UserService {\n  findOneUser() {}\n\n  createUser() {}\n}',
      filename: service,
      options,
      errors: [{ messageId: 'outOfOrder' }],
      output: 'class UserService {\n  createUser() {}\n\n  findOneUser() {}\n}',
    },
    {
      code: 'class UserService {\n  private readUser() {}\n\n  createUser() {}\n}',
      filename: service,
      options,
      errors: [{ messageId: 'privateBeforePublic' }],
      output: 'class UserService {\n  createUser() {}\n\n  private readUser() {}\n}',
    },
  ],
})

ruleTester.run('method-order, in a repository of several packages', methodOrder, {
  valid: [
    // A file with no `src` in its path belongs to no package's sources.
    {
      code: 'class UserService {\n  findOneUser() {}\n\n  createUser() {}\n}',
      filename: 'apps/x/services/user.service.ts',
      options,
    },
  ],
  invalid: [
    {
      code: 'class UserService {\n  findOneUser() {}\n\n  createUser() {}\n}',
      filename: packageSourceFile('apps/x', 'users', 'services', 'user.service.ts'),
      options,
      errors: [{ messageId: 'outOfOrder' }],
      output: 'class UserService {\n  createUser() {}\n\n  findOneUser() {}\n}',
    },
  ],
})

ruleTester.run('method-order, sorting a whole class', methodOrder, {
  valid: [],
  invalid: [
    // One fix puts every method in place, so the class converges in one pass, and a field between them stays put.
    {
      code: 'class UserService {\n  /** Writes. */\n  writeUser() {}\n\n  private cache = 1\n\n  private buildKey() {}\n\n  readUser() {}\n\n  /** Creates. */\n  createUser() {}\n}',
      filename: service,
      options,
      errors: [{ messageId: 'privateBeforePublic' }, { messageId: 'outOfOrder' }],
      output:
        'class UserService {\n  /** Creates. */\n  createUser() {}\n\n  private cache = 1\n\n  readUser() {}\n\n  /** Writes. */\n  writeUser() {}\n\n  private buildKey() {}\n}',
    },
  ],
})
