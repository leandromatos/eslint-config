import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sourceFile, typedRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { typedFixture } from '../../../rules/typed-fixture.rule.js'
import type { TestingOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'typed-fixture')
const ruleTester = typedRuleTester(root)
const options: [TestingOptions] = [{ ...EMPTY_OPTIONS, testFolder: '__tests__' }]
const spec = sourceFile('users', '__tests__', 'unit', 'user.service.spec.ts')
const declaration =
  'interface CreateUserInput { name: string }\ndeclare function createUser(input: CreateUserInput): void\n'

ruleTester.run('typed-fixture', typedFixture, {
  valid: [
    // A fixture that is the callee, and one handed to a signature that takes nothing, are typed by nobody.
    { code: `${declaration}const input = { name: 'a' }\ninput.name()`, options, filename: spec },
    { code: "declare function log(): void\nconst input = { name: 'a' }\nlog(input)", options, filename: spec },

    // Every shape that is not an anonymous fixture handed to a subject.
    { code: `${declaration}const input = 1\ncreateUser(input)`, options, filename: spec },
    { code: `${declaration}const input = { name: 'a' }\nconst other = input`, options, filename: spec },
    { code: `${declaration}const input = { name: 'a' }\nlog({ input })`, options, filename: spec },
    { code: "declare function log(): void\nconst input = { name: 'a' }\nlog()", options, filename: spec },

    { code: `${declaration}const input: CreateUserInput = { name: 'a' }\ncreateUser(input)`, options, filename: spec },
    { code: `${declaration}createUser({ name: 'a' })`, options, filename: spec },
    {
      code: `${declaration}const input = { name: 'a' }\ncreateUser(input)`,
      options,
      filename: sourceFile('users', 'services', 'user.service.ts'),
    },
    {
      code: "declare function log(value: { name: string }): void\nconst untyped = { name: 'a' }\nlog(untyped)",
      options,
      filename: spec,
    },
  ],
  invalid: [
    // A type declared at the root of the source tree is reached through no barrel, so the fix writes nothing.
    {
      code: "import { createFromRoot } from '../../services/create-from-root.service.js'\n\nconst input = { name: 'a' }\ncreateFromRoot(input)",
      options,
      filename: sourceFile('users', '__tests__', 'unit', 'root.service.spec.ts'),
      errors: [{ messageId: 'anonymousData' }],
      output: null,
    },

    // The type another file declares is imported through the barrel of its folder.
    {
      code: "import { createUserFromDto } from '../../services/create-user.service.js'\n\nconst input = { name: 'a' }\ncreateUserFromDto(input)",
      options,
      filename: sourceFile('users', '__tests__', 'unit', 'user.service.spec.ts'),
      errors: [{ messageId: 'anonymousData' }],
      output:
        "import { createUserFromDto } from '../../services/create-user.service.js'\nimport type { CreateUserDto } from '@/users/dtos'\n\nconst input: CreateUserDto = { name: 'a' }\ncreateUserFromDto(input)",
    },

    {
      code: `${declaration}const input = { name: 'a' }\ncreateUser(input)`,
      options,
      filename: spec,
      errors: [{ messageId: 'anonymousData' }],
      output: `${declaration}const input: CreateUserInput = { name: 'a' }\ncreateUser(input)`,
    },
  ],
})
