import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileRuleTester, sourceFile } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { knownSuffix } from '../../../rules/known-suffix.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'known-suffix')
const ruleTester = fileRuleTester(root)

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

    { code: 'export class UserService {}', filename: sourceFile('users', 'services', 'user.service.ts'), options },
    { code: 'export class UserModule {}', filename: sourceFile('users', 'user.module.ts'), options },
    { code: 'export * from "./services/index.js"', filename: sourceFile('users', 'index.ts'), options },
    { code: 'export const main = () => 1', filename: sourceFile('main.ts'), options },

    // The root file of a context: named after the directory, which carries responsibilities of its own.
    {
      code: 'export const databaseConfig = () => 1',
      filename: sourceFile('config', 'database', 'database.config.ts'),
      options,
    },
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
    // The name matches the directory, and the directory carries nothing, so the file belongs in the layer.
    {
      code: 'export const looseConfig = () => 1',
      filename: sourceFile('config', 'loose', 'loose.config.ts'),
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
