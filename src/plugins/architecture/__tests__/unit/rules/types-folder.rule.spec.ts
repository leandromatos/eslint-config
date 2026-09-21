import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { typesFolder } from '../../../rules/types-folder.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [ArchitectureOptions] = [{ ...EMPTY_OPTIONS, suffixToFolder: { service: 'services', type: 'types' } }]

ruleTester.run('types-folder', typesFolder, {
  valid: [
    // A file of another suffix under the types folder is where the mirror rule judges it.
    {
      code: 'export interface FindOneUserParams {\n  userId: string\n}',
      filename: sourceFile('users', 'types', 'services', 'user.service.ts'),
      options,
    },

    // A type declared under the types folder is where it belongs, whatever its file is called.
    {
      code: 'export interface FindOneUserParams {\n  userId: string\n}',
      filename: sourceFile('users', 'types', 'user.service.type.ts'),
      options,
    },

    {
      code: 'export interface FindOneUserParams {\n  userId: string\n}',
      filename: sourceFile('users', 'types', 'services', 'user.service.type.ts'),
      options,
    },
    { code: 'export class UserService {}', filename: sourceFile('users', 'services', 'user.service.ts'), options },
    { code: 'export interface Global {}', filename: sourceFile('global.d.ts'), options },
  ],
  invalid: [
    // A file with no suffix is mirrored by its own name.
    {
      code: 'export type UserId = string',
      filename: sourceFile('users', 'services', 'user.ts'),
      options,
      errors: [{ messageId: 'typeOutsideTypes' }],
    },

    {
      code: 'interface FindOneUserParams {\n  userId: string\n}\nexport class UserService {}',
      filename: sourceFile('users', 'services', 'user.service.ts'),
      options,
      errors: [{ messageId: 'typeOutsideTypes' }],
    },
    {
      code: 'export type UserId = string',
      filename: sourceFile('users', 'services', 'user.service.ts'),
      options,
      errors: [{ messageId: 'typeOutsideTypes' }],
    },
  ],
})

ruleTester.run('types-folder, where a type is read beside what it types', typesFolder, {
  valid: [
    // A file the folder names is a component too, and what it takes is read beside it.
    {
      code: 'export interface CardProps {\n  label: string\n}',
      filename: sourceFile('components', 'card.tsx'),
      options: [{ ...EMPTY_OPTIONS, suffixToFolder: { type: 'types' }, suffixFreeFolders: ['components'] }] as [
        ArchitectureOptions,
      ],
    },

    // What a hook takes is declared in the hook, which is where a reader of the call looks for it.
    {
      code: 'export interface UseSessionOptions {\n  id: string\n}',
      filename: sourceFile('features', 'auth', 'hooks', 'use-session.hook.ts'),
      options: [
        {
          ...EMPTY_OPTIONS,
          suffixToFolder: { hook: 'hooks', type: 'types' },
          coLocatedTypeSuffixes: ['hook'],
        },
      ] as [ArchitectureOptions],
    },
  ],
  invalid: [],
})

ruleTester.run('types-folder, on an augmentation of another module', typesFolder, {
  valid: [
    // `declare global` widens a type somebody else declared, and the widening belongs where it is read.
    {
      code: 'declare global {\n  interface Window {\n    axe: unknown\n  }\n}\n\nexport const a = 1',
      filename: sourceFile('users', 'services', 'user.service.ts'),
      options,
    },
  ],
  invalid: [],
})
