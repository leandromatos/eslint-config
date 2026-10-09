import path from 'node:path'

import {
  buildFixturePath,
  buildPackageSourcePath,
  buildSourcePath,
  createFileRuleTester,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { describesSource } from '../../../rules/describes-source.rule.js'
import type { TestingOptions } from '../../../types/index.js'

const root = buildFixturePath(import.meta.url, 'describes-source')
const ruleTester = createFileRuleTester(root)
const options: [TestingOptions] = [
  {
    ...EMPTY_OPTIONS,
    testFolder: '__tests__',
    testKinds: ['unit', 'e2e'],
    mirroringTestKinds: ['unit'],
    suffixToFolder: { service: 'services', spec: '__tests__' },
  },
]
const spec = buildSourcePath('users', '__tests__', 'unit', 'services', 'user.service.spec.ts')

ruleTester.run('describes-source', describesSource, {
  valid: [
    // A source that exports a list of names is read by each of them.
    {
      code: "describe('readUser', () => {})",
      filename: buildSourcePath('users', '__tests__', 'unit', 'utils', 'read-user.util.spec.ts'),
      options,
    },

    // A source that re-exports under another name is read by the name each export leaves by.
    {
      code: "describe('UserAliasService', () => {})",
      filename: buildSourcePath('users', '__tests__', 'unit', 'services', 'user-alias.service.spec.ts'),
      options,
    },

    // A call that is not a describe, and a describe of something that is not a name, are left alone.
    { code: "it('reads one user', () => {})", filename: spec, options },
    { code: 'describe(subject, () => {})', filename: spec, options },

    { code: "describe('UserService', () => {})", filename: spec, options },
    // With no source at the mirrored path, the file name stands for the subject.
    {
      code: "describe('MissingService', () => {})",
      filename: buildSourcePath('users', '__tests__', 'unit', 'services', 'missing.service.spec.ts'),
      options,
    },
    {
      code: "describe('Anything', () => {})",
      filename: buildSourcePath('users', '__tests__', 'e2e', 'users.spec.ts'),
      options,
    },
    {
      code: "describe('Anything', () => {})",
      filename: buildSourcePath('users', 'services', 'user.service.ts'),
      options,
    },
  ],
  invalid: [
    { code: "describe('Users', () => {})", filename: spec, options, errors: [{ messageId: 'wrongSubject' }] },
    {
      code: "describe('Whatever', () => {})",
      filename: buildSourcePath('users', '__tests__', 'unit', 'services', 'missing.service.spec.ts'),
      options,
      errors: [{ messageId: 'wrongSubject' }],
    },
  ],
})

const monorepoRoot = buildFixturePath(import.meta.url, 'describes-source-monorepo')
const monorepoRuleTester = createFileRuleTester(monorepoRoot)
const monorepoSpec = buildPackageSourcePath(
  'libs/core',
  'users',
  '__tests__',
  'unit',
  'utils',
  'read-user.util.spec.ts',
)

monorepoRuleTester.run('describes-source, in a repository of several packages', describesSource, {
  valid: [
    // The source is read under the package's own sources, so the name it exports is the name the spec describes.
    { code: "describe('readUsers', () => {})", filename: monorepoSpec, options },
    {
      code: "describe('Whatever', () => {})",
      filename: path.join('libs', 'core', '__tests__', 'unit', 'utils', 'read-user.util.spec.ts'),
      options,
    },
  ],
  invalid: [
    {
      code: "describe('ReadUser', () => {})",
      filename: monorepoSpec,
      options,
      errors: [
        { messageId: 'wrongSubject', data: { subject: 'ReadUser', stem: 'read-user.util', expected: 'readUsers' } },
      ],
    },
  ],
})
