import { buildFixturePath } from '../../../../../__tests__/utils/build-fixture-path.util.js'
import { buildSourcePath } from '../../../../../__tests__/utils/build-source-path.util.js'
import { createTypedRuleTester } from '../../../../../__tests__/utils/create-typed-rule-tester.util.js'
import { EMPTY_OPTIONS } from '../../../constants/testing.constant.js'
import { typedFixture } from '../../../rules/typed-fixture.rule.js'
import type { TestingOptions } from '../../../types/testing.type.js'

const root = buildFixturePath(import.meta.url, 'typed-fixture')
const ruleTester = createTypedRuleTester(root)
const options: [TestingOptions] = [{ ...EMPTY_OPTIONS, testFolder: '__tests__' }]
const spec = buildSourcePath('users', '__tests__', 'unit', 'user.service.spec.ts')
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
      filename: buildSourcePath('users', 'services', 'user.service.ts'),
    },
    // A rest parameter takes a list of the fixtures, so its type names no single fixture.
    {
      code: `${declaration}declare function log(...inputs: CreateUserInput[]): void\nconst input = { name: 'a' }\nlog(input)`,
      options,
      filename: spec,
    },
    {
      code: "declare function log(value: { name: string }): void\nconst untyped = { name: 'a' }\nlog(untyped)",
      options,
      filename: spec,
    },
  ],
  invalid: [
    // A type the spec declares, and one another file declares, are both named in the report.
    {
      code: `${declaration}const input = { name: 'a' }\ncreateUser(input)`,
      options,
      filename: spec,
      errors: [
        { messageId: 'anonymousFixture', data: { name: 'input', callee: 'createUser', type: 'CreateUserInput' } },
      ],
    },
    {
      code: "import { createUserFromDto } from '../../services/create-user.service.js'\n\nconst input = { name: 'a' }\ncreateUserFromDto(input)",
      options,
      filename: spec,
      errors: [
        { messageId: 'anonymousFixture', data: { name: 'input', callee: 'createUserFromDto', type: 'CreateUserDto' } },
      ],
    },
    // The report writes the type as the type-checker does, such as a generic with its argument.
    {
      code: "import { takeBox } from '../../services/take-shape.service.js'\n\nconst input = { value: 1 }\ntakeBox(input)",
      options,
      filename: spec,
      errors: [{ messageId: 'anonymousFixture', data: { name: 'input', callee: 'takeBox', type: 'Box<number>' } }],
    },
  ],
})
