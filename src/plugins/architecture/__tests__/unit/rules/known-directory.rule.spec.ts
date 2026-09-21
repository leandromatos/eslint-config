import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileRuleTester, sourceFile } from '../../../../../__tests__/utils/index.js'
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
  ],
  invalid: [
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
