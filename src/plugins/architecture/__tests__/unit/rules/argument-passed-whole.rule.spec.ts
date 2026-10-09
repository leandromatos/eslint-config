import {
  buildPackageSourcePath,
  buildSourcePath,
  createSyntaxRuleTester,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { argumentPassedWhole } from '../../../rules/argument-passed-whole.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

const options: [ArchitectureOptions] = [
  { ...EMPTY_OPTIONS, wholeArguments: [{ suffix: 'controller', objects: ['params', 'query', 'body'] }] },
]
const controller = buildSourcePath('users', 'controllers', 'user.controller.ts')

ruleTester.run('argument-passed-whole', argumentPassedWhole, {
  valid: [
    // A member of something the options do not govern is a field the caller may read.
    {
      code: 'class UserController {\n  findOneUser(params) {\n    return this.userService.findOneUser(this.userId)\n  }\n}',
      filename: controller,
      options,
    },
    {
      code: 'class UserController {\n  findOneUser(params) {\n    return this.userService.findOneUser(other.userId)\n  }\n}',
      filename: controller,
      options,
    },

    {
      code: 'class UserController {\n  findOneUser(params) {\n    return this.userService.findOneUser(params)\n  }\n}',
      filename: controller,
      options,
    },
    {
      code: 'class UserService {\n  findOneUser(params) {\n    return this.userRepository.findOneUser(params.userId)\n  }\n}',
      filename: buildSourcePath('users', 'services', 'user.service.ts'),
      options,
    },
  ],
  invalid: [
    {
      code: 'class UserController {\n  findOneUser(params) {\n    return this.userService.findOneUser(params.userId)\n  }\n}',
      filename: controller,
      options,
      errors: [{ messageId: 'unwrapped' }],
    },
    // The query and the body cross whole as well.
    {
      code: 'class UserController {\n  findAllUsers(query) {\n    return this.userService.findAllUsers(query.limit)\n  }\n}',
      filename: controller,
      options,
      errors: [{ messageId: 'unwrapped' }],
    },
    {
      code: 'class UserController {\n  createUser(body) {\n    return this.userService.createUser(body.name)\n  }\n}',
      filename: controller,
      options,
      errors: [{ messageId: 'unwrapped' }],
    },
  ],
})

ruleTester.run('argument-passed-whole, in a repository of several packages', argumentPassedWhole, {
  valid: [
    // A file with no `src` in its path belongs to no package's sources.
    {
      code: 'class UserController {\n  findOneUser(params) {\n    return this.userService.findOneUser(params.userId)\n  }\n}',
      filename: 'apps/x/controllers/user.controller.ts',
      options,
    },
  ],
  invalid: [
    {
      code: 'class UserController {\n  findOneUser(params) {\n    return this.userService.findOneUser(params.userId)\n  }\n}',
      filename: buildPackageSourcePath('apps/x', 'users', 'controllers', 'user.controller.ts'),
      options,
      errors: [{ messageId: 'unwrapped' }],
    },
    // The query and the body cross whole as well.
    {
      code: 'class UserController {\n  findAllUsers(query) {\n    return this.userService.findAllUsers(query.limit)\n  }\n}',
      filename: controller,
      options,
      errors: [{ messageId: 'unwrapped' }],
    },
    {
      code: 'class UserController {\n  createUser(body) {\n    return this.userService.createUser(body.name)\n  }\n}',
      filename: controller,
      options,
      errors: [{ messageId: 'unwrapped' }],
    },
  ],
})
