import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { methodResource } from '../../../rules/method-resource.rule.js'
import type { NamingOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [NamingOptions] = [
  {
    ...EMPTY_OPTIONS,
    resourceSuffixes: ['service', 'repository'],
    resourceFreeStems: ['auth'],
    resourceFreeMethods: ['onModuleInit'],
  },
]
const service = sourceFile('users', 'services', 'user.service.ts')

ruleTester.run('method-resource', methodResource, {
  valid: [
    { code: 'class UserService { findOneUser() {} }', filename: service, options },
    { code: 'class UserService { findManyUsers() {} }', filename: service, options },
    { code: 'class UserService { onModuleInit() {} }', filename: service, options },
    { code: 'class UserService { private findOne() {} }', filename: service, options },
    { code: 'class AuthService { login() {} }', filename: sourceFile('auth', 'services', 'auth.service.ts'), options },
    { code: 'class Anything { findOne() {} }', filename: sourceFile('users', 'utils', 'anything.util.ts'), options },
  ],
  invalid: [
    {
      code: 'class UserService { findOne() {} }',
      filename: service,
      options,
      errors: [{ messageId: 'missingResource' }],
    },
    {
      code: 'class UserRepository { create() {} }',
      filename: sourceFile('users', 'repositories', 'user.repository.ts'),
      options,
      errors: [{ messageId: 'missingResource' }],
    },
  ],
})
