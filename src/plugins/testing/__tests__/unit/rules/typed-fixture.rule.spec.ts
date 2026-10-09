import {
  buildFixturePath,
  buildPackageSourcePath,
  buildSourcePath,
  createTypedRuleTester,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { typedFixture } from '../../../rules/typed-fixture.rule.js'
import type { TestingOptions } from '../../../types/index.js'

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
      filename: buildSourcePath('users', '__tests__', 'unit', 'root.service.spec.ts'),
      errors: [{ messageId: 'anonymousFixture' }],
      output: null,
    },

    // The type another file declares is imported through the barrel of its folder.
    {
      code: "import { createUserFromDto } from '../../services/create-user.service.js'\n\nconst input = { name: 'a' }\ncreateUserFromDto(input)",
      options,
      filename: buildSourcePath('users', '__tests__', 'unit', 'user.service.spec.ts'),
      errors: [{ messageId: 'anonymousFixture' }],
      output:
        "import { createUserFromDto } from '../../services/create-user.service.js'\nimport type { CreateUserDto } from '@/users/dtos'\n\nconst input: CreateUserDto = { name: 'a' }\ncreateUserFromDto(input)",
    },
    // A type is reached through the barrel of the directory that declares it, named with the alias the project uses.
    {
      code: "import { pairDeviceFromDto } from '../../services/pair-device.service.js'\n\nconst input = { name: 'a' }\npairDeviceFromDto(input)",
      options: [{ ...EMPTY_OPTIONS, testFolder: '__tests__', alias: '~' }],
      filename: buildSourcePath('features', 'devices', '__tests__', 'unit', 'pair-device.service.spec.ts'),
      errors: [{ messageId: 'anonymousFixture' }],
      output:
        "import { pairDeviceFromDto } from '../../services/pair-device.service.js'\nimport type { PairDeviceDto } from '~/features/devices/dtos'\n\nconst input: PairDeviceDto = { name: 'a' }\npairDeviceFromDto(input)",
    },
    // A spec that imports nothing takes the import as its first line.
    {
      code: "declare const createUserFromDto: typeof import('../../services/create-user.service.js').createUserFromDto\n\nconst input = { name: 'a' }\ncreateUserFromDto(input)",
      options,
      filename: buildSourcePath('users', '__tests__', 'unit', 'user.service.spec.ts'),
      errors: [{ messageId: 'anonymousFixture' }],
      output:
        "import type { CreateUserDto } from '@/users/dtos'\ndeclare const createUserFromDto: typeof import('../../services/create-user.service.js').createUserFromDto\n\nconst input: CreateUserDto = { name: 'a' }\ncreateUserFromDto(input)",
    },

    {
      code: `${declaration}const input = { name: 'a' }\ncreateUser(input)`,
      options,
      filename: spec,
      errors: [{ messageId: 'anonymousFixture' }],
      output: `${declaration}const input: CreateUserInput = { name: 'a' }\ncreateUser(input)`,
    },
  ],
})

const monorepoRoot = buildFixturePath(import.meta.url, 'typed-fixture-monorepo')
const monorepoRuleTester = createTypedRuleTester(monorepoRoot)
const monorepoSpec = buildPackageSourcePath('apps/api', 'users', '__tests__', 'unit', 'user.service.spec.ts')

monorepoRuleTester.run('typed-fixture, in a repository of several packages', typedFixture, {
  valid: [],
  invalid: [
    // The alias reaches the sources of the spec's own package, so the barrel is named from there.
    {
      code: "import { createUserFromDto } from '../../services/create-user.service.js'\n\nconst input = { name: 'a' }\ncreateUserFromDto(input)",
      options,
      filename: monorepoSpec,
      errors: [{ messageId: 'anonymousFixture' }],
      output:
        "import { createUserFromDto } from '../../services/create-user.service.js'\nimport type { CreateUserDto } from '@/users/dtos'\n\nconst input: CreateUserDto = { name: 'a' }\ncreateUserFromDto(input)",
    },

    // A type another package declares is out of the alias's reach, so the fix writes nothing.
    {
      code: "import { createAccountFromDto } from '../../../../../../libs/core/src/accounts/services/create-account.service.js'\n\nconst input = { name: 'a' }\ncreateAccountFromDto(input)",
      options,
      filename: monorepoSpec,
      errors: [{ messageId: 'anonymousFixture' }],
      output: null,
    },
  ],
})
