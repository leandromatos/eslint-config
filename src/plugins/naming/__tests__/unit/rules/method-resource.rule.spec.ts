import { buildPackageSourcePath } from '../../../../../__tests__/utils/build-package-source-path.util.js'
import { buildSourcePath } from '../../../../../__tests__/utils/build-source-path.util.js'
import { createSyntaxRuleTester } from '../../../../../__tests__/utils/create-syntax-rule-tester.util.js'
import { EMPTY_OPTIONS } from '../../../constants/naming.constant.js'
import { methodResource } from '../../../rules/method-resource.rule.js'
import type { NamingOptions } from '../../../types/naming.type.js'

const ruleTester = createSyntaxRuleTester()

const options: [NamingOptions] = [
  {
    ...EMPTY_OPTIONS,
    resourceSuffixes: ['service', 'repository'],
    resourceFreeStems: ['auth'],
    resourceFreeMethods: ['onModuleInit'],
  },
]
const service = buildSourcePath('users', 'services', 'user.service.ts')

ruleTester.run('method-resource', methodResource, {
  valid: [
    { code: 'class UserService { findOneUser() {} }', filename: service, options },
    { code: 'class UserService { findManyUsers() {} }', filename: service, options },
    { code: 'class UserService { onModuleInit() {} }', filename: service, options },
    { code: 'class UserService { private findOne() {} }', filename: service, options },
    {
      code: 'class AuthService { login() {} }',
      filename: buildSourcePath('auth', 'services', 'auth.service.ts'),
      options,
    },
    {
      code: 'class Anything { findOne() {} }',
      filename: buildSourcePath('users', 'utils', 'anything.util.ts'),
      options,
    },
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
      filename: buildSourcePath('users', 'repositories', 'user.repository.ts'),
      options,
      errors: [{ messageId: 'missingResource' }],
    },
  ],
})

ruleTester.run('method-resource, in a repository of several packages', methodResource, {
  valid: [
    // A file with no `src` in its path belongs to no package's sources.
    { code: 'class UserService { findOne() {} }', filename: 'packages/x/services/user.service.ts', options },
  ],
  invalid: [
    {
      code: 'class UserService { findOne() {} }',
      filename: buildPackageSourcePath('packages/x', 'users', 'services', 'user.service.ts'),
      options,
      errors: [{ messageId: 'missingResource' }],
    },
  ],
})
