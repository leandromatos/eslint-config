import {
  buildPackageSourcePath,
  buildSourcePath,
  createSyntaxRuleTester,
  extendRuleOptions,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { oneExportPerUtil } from '../../../rules/one-export-per-util.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

const options: [ArchitectureOptions] = [{ ...EMPTY_OPTIONS, rootContexts: ['shared'], testFolder: '__tests__' }]
const util = buildSourcePath('users', 'utils', 'hash-password.util.ts')

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
    // A name exported as a string names no identifier the file declares under it.
    {
      code: "const hashPassword = () => 1\nconst comparePassword = () => 1\nexport { hashPassword, comparePassword as 'compare-password' }",
      filename: util,
      options,
    },

    // A file exporting one function under another name says nothing about the file's own name.
    { code: 'export function hashPassword() {\n  return 1\n}', filename: util, options },
    // A test helper is not a utility of the module.
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: buildSourcePath('users', '__tests__', 'utils', 'hash-password.util.ts'),
      options,
    },
    // A stand-in in the mock folder exports what its module exports, under the module's own name.
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: buildSourcePath('users', 'utils', '__mocks__', 'hash-password.util.ts'),
      options: extendRuleOptions(options, { mockFolder: '__mocks__' }),
    },

    { code: 'export const hashPassword = () => 1', filename: util, options },
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: buildSourcePath('users', 'utils', 'password.util.ts'),
      options,
    },
    {
      code: 'export const hashPassword = () => 1\nexport const comparePassword = () => 1',
      filename: buildSourcePath('shared', 'utils', 'hash-password.util.ts'),
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
    // A list at the end of the file publishes each name it carries.
    {
      code: 'const hashPassword = () => 1\nconst comparePassword = () => 1\nexport { hashPassword, comparePassword }',
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
      filename: buildPackageSourcePath('libs/x', 'users', 'utils', 'hash-password.util.ts'),
      options,
      errors: [{ messageId: 'namedAfterOne' }],
    },
  ],
})
