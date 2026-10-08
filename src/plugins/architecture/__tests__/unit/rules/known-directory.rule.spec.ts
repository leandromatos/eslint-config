import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileRuleTester, optionsWith, packageSourceFile, sourceFile } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { knownDirectory } from '../../../rules/known-directory.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'known-directory')
const ruleTester = fileRuleTester(root)
const options: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    suffixToFolder: { service: 'services', type: 'types' },
    mirrorFolders: ['types'],
    testKinds: ['unit'],
    rootContexts: ['config'],
  },
]

const containerOptions: [ArchitectureOptions] = [
  { ...options[0], moduleContainers: ['features'], suffixToFolder: { screen: 'screens', service: 'services' } },
]

ruleTester.run('known-directory', knownDirectory, {
  valid: [
    // A directory is reported once, on the file that stands for it, not on every file inside.
    { code: 'export class UserHelper {}', filename: sourceFile('users', 'helpers', 'user.helper.ts'), options },

    { code: 'export class UserService {}', filename: sourceFile('users', 'services', 'user.service.ts'), options },
    { code: 'export class UserHelper {}', filename: sourceFile('config', 'helpers', 'user.helper.ts'), options },

    // The testing folder holds what a package publishes for tests, under the module it serves.
    {
      code: 'export const buildCollectionEntity = () => 1',
      filename: sourceFile('users', 'testing', 'build-collection-entity.ts'),
      options: optionsWith(options, { testingFolder: 'testing' }),
    },
    // The mock folder sits beside the module it stands in for, wherever that module is.
    {
      code: 'export class UserService {}',
      filename: sourceFile('users', 'services', '__mocks__', 'user.service.ts'),
      options: optionsWith(options, { mockFolder: '__mocks__' }),
    },
  ],
  invalid: [
    // With no testing folder named, the directory is one the list does not carry.
    {
      code: 'export const buildCollectionEntity = () => 1',
      filename: sourceFile('users', 'testing', 'build-collection-entity.ts'),
      options,
      errors: [{ messageId: 'unknownDirectory', data: { directory: 'testing' } }],
    },
    // With no mock folder named, the stand-in's directory is one the list does not carry.
    {
      code: 'export class UserService {}',
      filename: sourceFile('users', 'services', '__mocks__', 'user.service.ts'),
      options,
      errors: [{ messageId: 'unknownDirectory', data: { directory: '__mocks__' } }],
    },
    {
      code: 'export class OtherHelper {}',
      filename: sourceFile('users', 'helpers', 'other.helper.ts'),
      options,
      errors: [{ messageId: 'unknownDirectory' }],
    },
  ],
})

ruleTester.run('known-directory, under a module container', knownDirectory, {
  valid: [
    // `features` holds modules, so the layer starts one segment later: `devices` is the module, `screens` the layer.
    {
      code: 'export const deviceScreen = 1',
      filename: sourceFile('features', 'devices', 'screens', 'device.screen.ts'),
      options: containerOptions,
    },
  ],
  invalid: [
    // The layer inside the module still answers to the list.
    {
      code: 'export const gadget = 1',
      filename: sourceFile('features', 'devices', 'gadgets', 'gadget.ts'),
      options: containerOptions,
      errors: [{ messageId: 'unknownDirectory' }],
    },
  ],
})

const monorepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'fixtures',
  'known-directory-monorepo',
)
const monorepoRuleTester = fileRuleTester(monorepoRoot)

monorepoRuleTester.run('known-directory, in a repository of several packages', knownDirectory, {
  valid: [
    {
      code: 'export class UserService {}',
      filename: packageSourceFile('libs/core', 'users', 'services', 'user.service.ts'),
      options,
    },
    { code: 'export class UserHelper {}', filename: path.join('scripts', 'helpers', 'user.helper.ts'), options },
  ],
  invalid: [
    {
      code: 'export class UserHelper {}',
      filename: packageSourceFile('apps/api', 'users', 'helpers', 'user.helper.ts'),
      options,
      errors: [{ messageId: 'unknownDirectory', data: { directory: 'helpers' } }],
    },
  ],
})

const baseOptions: [ArchitectureOptions] = [{ ...options[0], baseFolders: ['core'] }]

ruleTester.run('known-directory, with a base folder', knownDirectory, {
  valid: [
    // The root of a capability holds the base classes every driver shares.
    {
      code: 'export abstract class DomainEvent {}',
      filename: sourceFile('events', 'core', 'domain-event.ts'),
      options: baseOptions,
    },
    // A mirror of the module root mirrors its base folder too.
    {
      code: 'export interface DomainEventPayload {}',
      filename: sourceFile('events', 'types', 'core', 'domain-event.type.ts'),
      options: baseOptions,
    },
  ],
  invalid: [
    // Below a layer, the folder is not the module's base, and the list does not carry it there.
    {
      code: 'export abstract class DomainEvent {}',
      filename: sourceFile('events', 'services', 'core', 'domain-event.ts'),
      options: baseOptions,
      errors: [{ messageId: 'unknownDirectory', data: { directory: 'core' } }],
    },
  ],
})

ruleTester.run('known-directory, with a driver inside its capability', knownDirectory, {
  valid: [
    // A directory at the root of the module that holds layers of its own is a context, and its layers are on the list.
    {
      code: 'export class KeyvService {}',
      filename: sourceFile('cache', 'keyv', 'services', 'keyv.service.ts'),
      options,
    },
    { code: 'export class KeyvModule {}', filename: sourceFile('cache', 'keyv', 'keyv.module.ts'), options },
  ],
  invalid: [
    // A directory that holds no layer is a responsibility nobody declared.
    {
      code: 'export const build = () => 1',
      filename: sourceFile('cache', 'loose', 'build.ts'),
      options,
      errors: [{ messageId: 'unknownDirectory', data: { directory: 'loose' } }],
    },
  ],
})
