import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
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
