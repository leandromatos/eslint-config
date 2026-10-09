import path from 'node:path'

import {
  buildFixturePath,
  buildPackageSourcePath,
  buildSourcePath,
  createFileRuleTester,
  extendRuleOptions,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { knownSuffix } from '../../../rules/known-suffix.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const root = buildFixturePath(import.meta.url, 'known-suffix')
const ruleTester = createFileRuleTester(root)

const options: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    suffixToFolder: { service: 'services', repository: 'repositories', type: 'types', config: 'configs' },
    folderlessSuffixes: ['module'],
    mirrorFolders: ['types'],
  },
]

ruleTester.run('known-suffix', knownSuffix, {
  valid: [
    // A file outside the source root is nothing this rule places.
    { code: 'export const release = () => 1', filename: 'scripts/release.ts', options },

    { code: 'export class UserService {}', filename: buildSourcePath('users', 'services', 'user.service.ts'), options },
    { code: 'export class UserModule {}', filename: buildSourcePath('users', 'user.module.ts'), options },
    { code: 'export * from "./services/index.js"', filename: buildSourcePath('users', 'index.ts'), options },
    { code: 'export const main = () => 1', filename: buildSourcePath('main.ts'), options },

    // The root file of a context: named after the directory, which carries responsibilities of its own.
    {
      code: 'export const databaseConfig = () => 1',
      filename: buildSourcePath('config', 'database', 'database.config.ts'),
      options,
    },
  ],
  invalid: [
    {
      code: 'export const read = () => 1',
      filename: buildSourcePath('users', 'read.ts'),
      options,
      errors: [{ messageId: 'noSuffix' }],
    },
    {
      code: 'export class UserHelper {}',
      filename: buildSourcePath('users', 'helpers', 'user.helper.ts'),
      options,
      errors: [{ messageId: 'unknownSuffix' }],
    },
    {
      code: 'export class UserService {}',
      filename: buildSourcePath('users', 'repositories', 'user.service.ts'),
      options,
      errors: [{ messageId: 'wrongFolder' }],
    },
    // The name matches the directory, and the directory carries nothing, so the file belongs in the layer.
    {
      code: 'export const looseConfig = () => 1',
      filename: buildSourcePath('config', 'loose', 'loose.config.ts'),
      options,
      errors: [{ messageId: 'wrongFolder' }],
    },
  ],
})

ruleTester.run('known-suffix, where the folder says what the file is', knownSuffix, {
  valid: [
    // A component is named after the function in it, and the folder it sits in says what it is.
    {
      code: 'export const Card = () => null',
      filename: buildSourcePath('components', 'card.tsx'),
      options: extendRuleOptions([EMPTY_OPTIONS], { suffixFreeFolders: ['components'] }),
    },
  ],
  invalid: [],
})

ruleTester.run('known-suffix, under a folder that mirrors the layers', knownSuffix, {
  valid: [
    // A mirror holds files of other layers, so the folder of the suffix is not where they sit.
    {
      code: 'export const readPerson = () => null',
      filename: buildSourcePath('features', 'account', 'server', 'read-person.util.ts'),
      options: extendRuleOptions([EMPTY_OPTIONS], { suffixToFolder: { util: 'utils' }, mirrorFolders: ['server'] }),
    },
  ],
  invalid: [],
})

const monorepoRoot = buildFixturePath(import.meta.url, 'known-suffix-monorepo')
const monorepoRuleTester = createFileRuleTester(monorepoRoot)

monorepoRuleTester.run('known-suffix, in a repository of several packages', knownSuffix, {
  valid: [
    // The context is read under the package's own sources.
    {
      code: 'export const databaseConfig = () => 1',
      filename: buildPackageSourcePath('libs/core', 'config', 'database', 'database.config.ts'),
      options,
    },
    { code: 'export const release = () => 1', filename: path.join('apps', 'api', 'scripts', 'release.ts'), options },
  ],
  invalid: [
    {
      code: 'export const looseConfig = () => 1',
      filename: buildPackageSourcePath('apps/api', 'config', 'loose', 'loose.config.ts'),
      options,
      errors: [{ messageId: 'wrongFolder' }],
    },
    {
      code: 'export const read = () => 1',
      filename: buildPackageSourcePath('packages/web', 'users', 'read.ts'),
      options,
      errors: [{ messageId: 'noSuffix' }],
    },
  ],
})

ruleTester.run('known-suffix, under a base folder', knownSuffix, {
  valid: [
    // A base class at the root of a capability is named for what it is.
    {
      code: 'export abstract class DomainEvent {}',
      filename: buildSourcePath('events', 'core', 'domain-event.ts'),
      options: extendRuleOptions(options, { baseFolders: ['core'] }),
    },
  ],
  invalid: [
    // Anywhere else the folder says nothing about its files.
    {
      code: 'export abstract class DomainEvent {}',
      filename: buildSourcePath('events', 'services', 'core', 'domain-event.ts'),
      options: extendRuleOptions(options, { baseFolders: ['core'] }),
      errors: [{ messageId: 'noSuffix' }],
    },
  ],
})

ruleTester.run('known-suffix, in a driver inside its capability', knownSuffix, {
  valid: [
    // A layer of the driver sits under the folder of its suffix, inside the driver.
    {
      code: 'export class KeyvService {}',
      filename: buildSourcePath('cache', 'keyv', 'services', 'keyv.service.ts'),
      options,
    },
  ],
  invalid: [
    {
      code: 'export class KeyvService {}',
      filename: buildSourcePath('cache', 'keyv', 'repositories', 'keyv.service.ts'),
      options,
      errors: [{ messageId: 'wrongFolder' }],
    },
  ],
})

ruleTester.run('known-suffix, in the mock folder', knownSuffix, {
  valid: [
    // A stand-in carries the name of the package it imitates, as the test runner reads it.
    {
      code: 'export const create = () => null',
      filename: buildSourcePath('__tests__', '__mocks__', 'zustand.ts'),
      options: extendRuleOptions(options, { mockFolder: '__mocks__' }),
    },
    {
      code: 'export const BottomSheet = () => null',
      filename: buildSourcePath('__tests__', '__mocks__', '@gorhom', 'bottom-sheet.tsx'),
      options: extendRuleOptions(options, { mockFolder: '__mocks__' }),
    },
  ],
  invalid: [
    // With no mock folder named, the stand-in is a file like any other.
    {
      code: 'export const create = () => null',
      filename: buildSourcePath('__tests__', '__mocks__', 'zustand.ts'),
      options,
      errors: [{ messageId: 'noSuffix' }],
    },
  ],
})
