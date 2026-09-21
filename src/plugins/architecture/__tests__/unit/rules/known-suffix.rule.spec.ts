import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { knownSuffix } from '../../../rules/known-suffix.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    suffixToFolder: { service: 'services', repository: 'repositories', type: 'types' },
    folderlessSuffixes: ['module'],
  },
]

ruleTester.run('known-suffix', knownSuffix, {
  valid: [
    // A file outside the source root is nothing this rule places.
    { code: 'export const release = () => 1', filename: 'scripts/release.ts', options },

    { code: 'export class UserService {}', filename: sourceFile('users', 'services', 'user.service.ts'), options },
    { code: 'export class UserModule {}', filename: sourceFile('users', 'user.module.ts'), options },
    { code: 'export * from "./services/index.js"', filename: sourceFile('users', 'index.ts'), options },
    { code: 'export const main = () => 1', filename: sourceFile('main.ts'), options },
  ],
  invalid: [
    {
      code: 'export const read = () => 1',
      filename: sourceFile('users', 'read.ts'),
      options,
      errors: [{ messageId: 'noSuffix' }],
    },
    {
      code: 'export class UserHelper {}',
      filename: sourceFile('users', 'helpers', 'user.helper.ts'),
      options,
      errors: [{ messageId: 'unknownSuffix' }],
    },
    {
      code: 'export class UserService {}',
      filename: sourceFile('users', 'repositories', 'user.service.ts'),
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
      filename: sourceFile('components', 'card.tsx'),
      options: [{ ...EMPTY_OPTIONS, suffixFreeFolders: ['components'] }] as [ArchitectureOptions],
    },
  ],
  invalid: [],
})

ruleTester.run('known-suffix, under a folder that mirrors the layers', knownSuffix, {
  valid: [
    // A mirror holds files of other layers, so the folder of the suffix is not where they sit.
    {
      code: 'export const readPerson = () => null',
      filename: sourceFile('features', 'account', 'server', 'read-person.util.ts'),
      options: [{ ...EMPTY_OPTIONS, suffixToFolder: { util: 'utils' }, mirrorFolders: ['server'] }] as [
        ArchitectureOptions,
      ],
    },
  ],
  invalid: [],
})
