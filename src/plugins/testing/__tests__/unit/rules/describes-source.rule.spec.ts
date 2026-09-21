import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fileRuleTester, sourceFile } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { describesSource } from '../../../rules/describes-source.rule.js'
import type { TestingOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'describes-source')
const ruleTester = fileRuleTester(root)
const options: [TestingOptions] = [
  {
    ...EMPTY_OPTIONS,
    testFolder: '__tests__',
    testKinds: ['unit', 'e2e'],
    mirroringTestKinds: ['unit'],
    suffixToFolder: { service: 'services', spec: '__tests__' },
  },
]
const spec = sourceFile('users', '__tests__', 'unit', 'services', 'user.service.spec.ts')

ruleTester.run('describes-source', describesSource, {
  valid: [
    // A source that exports a list of names is read by each of them.
    {
      code: "describe('readUser', () => {})",
      filename: sourceFile('users', '__tests__', 'unit', 'utils', 'read-user.util.spec.ts'),
      options,
    },

    // A source that re-exports under another name is read by the name each export leaves by.
    {
      code: "describe('UserAliasService', () => {})",
      filename: sourceFile('users', '__tests__', 'unit', 'services', 'user-alias.service.spec.ts'),
      options,
    },

    // A call that is not a describe, and a describe of something that is not a name, are left alone.
    { code: "it('reads one user', () => {})", filename: spec, options },
    { code: 'describe(subject, () => {})', filename: spec, options },

    { code: "describe('UserService', () => {})", filename: spec, options },
    {
      code: "describe('MissingService', () => {})",
      filename: sourceFile('users', '__tests__', 'unit', 'services', 'missing.service.spec.ts'),
      options,
    },
    {
      code: "describe('Anything', () => {})",
      filename: sourceFile('users', '__tests__', 'e2e', 'users.spec.ts'),
      options,
    },
    { code: "describe('Anything', () => {})", filename: sourceFile('users', 'services', 'user.service.ts'), options },
  ],
  invalid: [
    { code: "describe('Users', () => {})", filename: spec, options, errors: [{ messageId: 'wrongSubject' }] },
    {
      code: "describe('Whatever', () => {})",
      filename: sourceFile('users', '__tests__', 'unit', 'services', 'missing.service.spec.ts'),
      options,
      errors: [{ messageId: 'wrongSubject' }],
    },
  ],
})
