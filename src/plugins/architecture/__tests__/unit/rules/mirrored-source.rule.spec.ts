import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileRuleTester, optionsWith, packageSourceFile, sourceFile } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { mirroredSource } from '../../../rules/mirrored-source.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'mirrored-source')
const ruleTester = fileRuleTester(root)
const options: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    suffixToFolder: { screen: 'screens', service: 'services', type: 'types', spec: '__tests__' },
    mirrorFolders: ['types', '__tests__'],
    testFolder: '__tests__',
    testKinds: ['unit', 'e2e'],
    mirroringTestKinds: ['unit'],
  },
]

ruleTester.run('mirrored-source', mirroredSource, {
  valid: [
    // A file with no suffix mirrors nothing by name.
    { code: 'export const read = () => 1', filename: sourceFile('users', 'types', 'read.ts'), options },
    // A suffix whose folder is not a mirror is judged by where it lives, not by what it mirrors.
    { code: 'export class UserService {}', filename: sourceFile('users', 'services', 'user.service.ts'), options },
    // A type file outside the mirror folder is the types rule's business, not this one's.
    { code: 'export interface UserRole {\n  name: string\n}', filename: sourceFile('users', 'user.type.ts'), options },
    // A mirror folder inside a test kind mirrors that kind's own tree, where a spec and a helper sit side by side.
    {
      code: 'export const boot = () => 1',
      filename: sourceFile('users', '__tests__', 'unit', 'types', 'user.service.type.ts'),
      options,
    },
    // A file under the test tree that names no kind may stand for a plain file or for a test of any kind.
    {
      code: 'describe("UserService", () => {})',
      filename: sourceFile('users', '__tests__', 'types', 'user.service.type.ts'),
      options,
    },

    {
      code: 'export interface FindOneUserParams {\n  userId: string\n}',
      filename: sourceFile('users', 'types', 'services', 'user.service.type.ts'),
      options,
    },
    {
      code: "describe('UserService', () => {})",
      filename: sourceFile('users', '__tests__', 'unit', 'services', 'user.service.spec.ts'),
      options,
    },
    {
      code: "describe('Users', () => {})",
      filename: sourceFile('users', '__tests__', 'e2e', 'users.spec.ts'),
      options,
    },
    {
      code: 'export interface UserRole {\n  name: string\n}',
      filename: sourceFile('users', 'types', 'users.type.ts'),
      options,
    },
    {
      code: 'export interface ServiceOptions {\n  name: string\n}',
      filename: sourceFile('users', 'services', 'types', 'services.type.ts'),
      options,
    },
    // A screen is written in `.tsx`, and the spec of one mirrors it under that extension.
    {
      code: "describe('UserScreen', () => {})",
      filename: sourceFile('users', '__tests__', 'unit', 'screens', 'user.screen.spec.tsx'),
      options,
    },
    // The type beside a screen mirrors it under that extension too.
    {
      code: 'export interface UserScreenProps {\n  userId: string\n}',
      filename: sourceFile('users', 'types', 'screens', 'user.screen.type.ts'),
      options,
    },
    // A stand-in in the mock folder is paired with its module by name, by the test runner, so it mirrors nothing.
    {
      code: 'export interface FindOneUserParams {\n  userId: string\n}',
      filename: sourceFile('users', 'types', 'services', '__mocks__', 'user.service.type.ts'),
      options: optionsWith(options, { mockFolder: '__mocks__' }),
    },
  ],
  invalid: [
    // A mirror folder inside the test tree, naming a kind, mirrors a spec of that kind.
    {
      code: 'export interface MissingParams {\n  id: string\n}',
      filename: sourceFile('users', '__tests__', 'types', 'unit', 'missing.service.type.ts'),
      options,
      errors: [{ messageId: 'noSource' }],
    },
    // A spec written straight under the test folder mirrors a source of the tree beside it.
    {
      code: 'describe("Missing", () => {})',
      filename: sourceFile('users', '__tests__', 'missing.spec.ts'),
      options,
      errors: [{ messageId: 'noSource' }],
    },

    // A mirror folder inside a test kind mirrors a spec of that kind, which this tree does not hold.
    {
      code: 'export interface MissingParams {\n  id: string\n}',
      filename: sourceFile('users', '__tests__', 'unit', 'types', 'missing.service.type.ts'),
      options,
      errors: [{ messageId: 'noSource' }],
    },
    // A mirror folder under the test tree, naming no kind, mirrors a plain file or a spec of any kind.
    {
      code: 'export interface MissingParams {\n  id: string\n}',
      filename: sourceFile('users', '__tests__', 'types', 'missing.service.type.ts'),
      options,
      errors: [{ messageId: 'noSource' }],
    },

    {
      code: 'export interface MissingParams {\n  id: string\n}',
      filename: sourceFile('users', 'types', 'services', 'missing.service.type.ts'),
      options,
      errors: [{ messageId: 'noSource' }],
    },
  ],
})

const monorepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'fixtures',
  'mirrored-source-monorepo',
)
const monorepoRuleTester = fileRuleTester(monorepoRoot)

monorepoRuleTester.run('mirrored-source, in a repository of several packages', mirroredSource, {
  valid: [
    {
      code: 'export interface FindOneUserParams {\n  userId: string\n}',
      filename: packageSourceFile('apps/api', 'users', 'types', 'services', 'user.service.type.ts'),
      options,
    },
    {
      code: 'export interface MissingParams {}',
      filename: path.join('apps', 'api', 'types', 'services', 'missing.service.type.ts'),
      options,
    },
  ],
  invalid: [
    // The expected path is written from the working directory, so it names the package the source belongs to.
    {
      code: 'export interface MissingParams {}',
      filename: packageSourceFile('apps/api', 'users', 'types', 'services', 'missing.service.type.ts'),
      options,
      errors: [
        {
          messageId: 'noSource',
          data: {
            file: 'missing.service.type.ts',
            expected: `${packageSourceFile('apps/api', 'users', 'services', 'missing.service.ts')} or ${packageSourceFile('apps/api', 'users', 'services', 'missing.service.tsx')}`,
          },
        },
      ],
    },
  ],
})

ruleTester.run('mirrored-source, in a driver inside its capability', mirroredSource, {
  valid: [
    // The driver's mirror reads the driver's own tree, and its vocabulary is named after the driver.
    {
      code: 'export interface KeyvServiceOptions {}',
      filename: sourceFile('cache', 'keyv', 'types', 'services', 'keyv.service.type.ts'),
      options,
    },
    {
      code: 'export interface KeyvOptions {}',
      filename: sourceFile('cache', 'keyv', 'types', 'keyv.type.ts'),
      options,
    },
  ],
  invalid: [
    {
      code: 'export interface MissingOptions {}',
      filename: sourceFile('cache', 'keyv', 'types', 'services', 'missing.service.type.ts'),
      options,
      errors: [{ messageId: 'noSource' }],
    },
  ],
})

ruleTester.run('mirrored-source, over a module split by platform', mirroredSource, {
  valid: [
    // The props both platform files take mirror the name a caller imports, which neither file is called.
    {
      code: 'export interface ToggleProps {\n  isOn: boolean\n}',
      filename: sourceFile('components', 'native', 'types', 'toggle.type.ts'),
      options,
    },
  ],
  invalid: [
    // The report names the shared file, which is the one to create when no platform splits it.
    {
      code: 'export interface SwitchProps {\n  isOn: boolean\n}',
      filename: sourceFile('components', 'native', 'types', 'switch.type.ts'),
      options,
      errors: [
        {
          messageId: 'noSource',
          data: {
            file: 'switch.type.ts',
            expected: 'src/components/native/switch.ts or src/components/native/switch.tsx',
          },
        },
      ],
    },
  ],
})

ruleTester.run('mirrored-source, in the types of a test tree', mirroredSource, {
  valid: [
    // The vocabulary of the tests of a module, shared by its specs, is named after the module and mirrors nothing.
    {
      code: 'export interface AccountAttributes {\n  id: string\n}',
      filename: sourceFile('users', '__tests__', 'types', 'users.type.ts'),
      options,
    },
  ],
  invalid: [
    {
      code: 'export interface AccountAttributes {\n  id: string\n}',
      filename: sourceFile('users', '__tests__', 'types', 'accounts.type.ts'),
      options,
      errors: [{ messageId: 'noSource' }],
    },
  ],
})
