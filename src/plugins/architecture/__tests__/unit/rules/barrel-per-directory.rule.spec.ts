import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileRuleTester, sourceFile } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { barrelPerDirectory } from '../../../rules/barrel-per-directory.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'barrel-per-directory')
const ruleTester = fileRuleTester(root)
const options: [ArchitectureOptions] = [
  { ...EMPTY_OPTIONS, rootContexts: ['config'], testFolder: '__tests__', executedFolders: ['migrations'] },
]

ruleTester.run('barrel-per-directory', barrelPerDirectory, {
  valid: [
    // A file at the root of the source tree, one under a root context, and one under an executed folder.
    { code: 'export const main = () => 1', filename: sourceFile('main.ts'), options },
    { code: 'export const read = () => 1', filename: sourceFile('config', 'database', 'read.ts'), options },
    {
      code: 'export const migrate = () => 1',
      filename: sourceFile('users', 'migrations', 'first.migration.ts'),
      options,
    },
    { code: 'export const boot = () => 1', filename: sourceFile('users', '__tests__', 'boot.util.ts'), options },

    { code: 'export * from "./user.service.js"', filename: sourceFile('users', 'services', 'index.ts'), options },
    { code: 'export class UserService {}', filename: sourceFile('users', 'services', 'user.service.ts'), options },
  ],
  invalid: [
    {
      code: 'export * from "./services/index.js"',
      filename: sourceFile('users', 'index.ts'),
      options,
      errors: [{ messageId: 'barrelAtRoot' }],
    },
    {
      code: 'export class AccountRepository {}',
      filename: sourceFile('accounts', 'repositories', 'account.repository.ts'),
      options,
      errors: [{ messageId: 'missingBarrel' }],
    },
  ],
})

ruleTester.run('barrel-per-directory, under a module container', barrelPerDirectory, {
  valid: [
    // A container holds modules rather than sources, so it carries no barrel of its own.
    {
      code: 'export const registry = 1',
      filename: sourceFile('features', 'registry.ts'),
      options: [{ ...EMPTY_OPTIONS, moduleContainers: ['features'] }] as [ArchitectureOptions],
    },

    // A module of a barrelled container is reached whole, so its root is where its barrel belongs.
    {
      code: 'export const device = 1',
      filename: sourceFile('features', 'devices', 'device.entity.ts'),
      options: [{ ...EMPTY_OPTIONS, moduleContainers: ['features'], barrelledContainers: ['features'] }] as [
        ArchitectureOptions,
      ],
    },

    // The module inside it is the root, so it carries none either.
    {
      code: 'export const device = 1',
      filename: sourceFile('features', 'devices', 'device.entity.ts'),
      options: [{ ...EMPTY_OPTIONS, moduleContainers: ['features'] }] as [ArchitectureOptions],
    },
  ],
  invalid: [],
})

const publishedRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'fixtures',
  'barrel-per-directory-published',
)
const publishedRuleTester = fileRuleTester(publishedRoot)

publishedRuleTester.run('barrel-per-directory, in a package that publishes its directories', barrelPerDirectory, {
  valid: [
    // The manifest points at this barrel, so it is the entrypoint rather than a module root.
    { code: 'export * from "./services/index.js"', filename: sourceFile('users', 'index.ts'), options },
    { code: 'export * from "./user.service.js"', filename: sourceFile('users', 'services', 'index.ts'), options },
  ],
  invalid: [],
})
