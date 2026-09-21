import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileRuleTester, sourceFile } from '../../../../../__tests__/utils/index.js'
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
