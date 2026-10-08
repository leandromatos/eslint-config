import { packageSourceFile, sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { oneExportPerUtil } from '../../../rules/one-export-per-util.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [ArchitectureOptions] = [{ ...EMPTY_OPTIONS, rootContexts: ['shared'], testFolder: '__tests__' }]
const util = sourceFile('users', 'utils', 'hash-password.util.ts')

ruleTester.run('one-export-per-util', oneExportPerUtil, {
  valid: [
    // An export that declares nothing, or declares something other than a value, names no function.
    {
      code: "export { hashPassword } from './other.util.js'\nexport const comparePassword = () => 1",
      filename: util,
      options,
    },
    {
      code: 'export interface HashPassword {\n  raw: string\n}\nexport const comparePassword = () => 1',
      filename: util,
      options,
    },
    { code: 'export const [hashPassword] = handlers\nexport const comparePassword = () => 1', filename: util, options },

    // A file exporting one function under another name says nothing about the file's own name.
    { code: 'export function hashPassword() {\n  return 1\n}', filename: util, options },
    // A test helper is not a utility of the module.
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: sourceFile('users', '__tests__', 'utils', 'hash-password.util.ts'),
      options,
    },
    // A stand-in in the mock folder exports what its module exports, under the module's own name.
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: sourceFile('users', 'utils', '__mocks__', 'hash-password.util.ts'),
      options: [{ ...options[0], mockFolder: '__mocks__' }] as [ArchitectureOptions],
    },

    { code: 'export const hashPassword = () => 1', filename: util, options },
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: sourceFile('users', 'utils', 'password.util.ts'),
      options,
    },
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: sourceFile('shared', 'utils', 'hash-password.util.ts'),
      options,
    },
  ],
  invalid: [
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: util,
      options,
      errors: [{ messageId: 'namedAfterOne' }],
    },
  ],
})

ruleTester.run('one-export-per-util, in a repository of several packages', oneExportPerUtil, {
  valid: [
    // A file with no `src` in its path belongs to no package's sources.
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: 'libs/x/utils/hash-password.util.ts',
      options,
    },
  ],
  invalid: [
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: packageSourceFile('libs/x', 'users', 'utils', 'hash-password.util.ts'),
      options,
      errors: [{ messageId: 'namedAfterOne' }],
    },
  ],
})
