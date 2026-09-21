import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { argumentPassedWhole } from '../../../rules/argument-passed-whole.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [ArchitectureOptions] = [
  { ...EMPTY_OPTIONS, wholeArguments: [{ suffix: 'controller', objects: ['params', 'query', 'body'] }] },
]
const controller = sourceFile('users', 'controllers', 'user.controller.ts')

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
      filename: sourceFile('users', 'services', 'user.service.ts'),
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
  ],
})
