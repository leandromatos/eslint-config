import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { typeSuffix } from '../../../rules/type-suffix.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    suffixToFolder: { type: 'types' },
    typeSuffixes: { services: ['Params', 'Query'], repositories: ['Input', 'Filters'] },
  },
]
const serviceType = sourceFile('users', 'types', 'services', 'user.service.type.ts')

ruleTester.run('type-suffix', typeSuffix, {
  valid: [
    // A file of another suffix, and one whose folder the options do not govern, are left alone.
    { code: 'export class UserService {}', filename: sourceFile('users', 'services', 'user.service.ts'), options },
    {
      code: 'export interface CacheFallback {\n  ttl: number\n}',
      filename: sourceFile('users', 'types', 'caches', 'user.cache.type.ts'),
      options,
    },
    // A type file at the root of the mirror is the module's own vocabulary, under no folder.
    {
      code: 'export interface UserRole {\n  name: string\n}',
      filename: sourceFile('users', 'types', 'users.type.ts'),
      options,
    },
    // An export that declares no type is nothing this rule names.
    { code: 'export const LIMIT = 10', filename: serviceType, options },

    { code: 'export interface FindOneUserParams {\n  userId: string\n}', filename: serviceType, options },
    { code: 'export type UserRole = string', filename: serviceType, options },
    {
      code: 'export interface CreateUserInput {\n  name: string\n}',
      filename: sourceFile('users', 'types', 'repositories', 'user.repository.type.ts'),
      options,
    },
  ],
  invalid: [
    {
      code: 'export interface CreateUserInput {\n  name: string\n}',
      filename: serviceType,
      options,
      errors: [{ messageId: 'wrongFolder' }],
    },
    {
      code: 'export interface ParamsOfUser {\n  userId: string\n}',
      filename: serviceType,
      options,
      errors: [{ messageId: 'suffixInside' }],
    },
  ],
})
