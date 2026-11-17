import { buildFixturePath } from '../../../../../__tests__/utils/build-fixture-path.util.js'
import { buildPackageSourcePath } from '../../../../../__tests__/utils/build-package-source-path.util.js'
import { buildSourcePath } from '../../../../../__tests__/utils/build-source-path.util.js'
import { createFileRuleTester } from '../../../../../__tests__/utils/create-file-rule-tester.util.js'
import { EMPTY_OPTIONS } from '../../../constants/architecture.constant.js'
import { importBoundaries } from '../../../rules/import-boundaries.rule.js'
import type { ArchitectureOptions } from '../../../types/architecture.type.js'

const root = buildFixturePath(import.meta.url, 'import-boundaries')
const ruleTester = createFileRuleTester(root)

const options: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    alias: '@',
    suffixToFolder: { entity: 'entities', service: 'services', type: 'types' },
    testFolder: '__tests__',
  },
]
const entity = buildSourcePath('accounts', 'tokens', 'entities', 'token.entity.ts')
const moduleFile = buildSourcePath('accounts', 'tokens', 'tokens.module.ts')
const spec = buildSourcePath('accounts', 'tokens', '__tests__', 'unit', 'tokens.service.spec.ts')

ruleTester.run('import-boundaries', importBoundaries, {
  valid: [
    // An export that declares its value reaches no other file.
    { code: 'export const TOKEN_TTL = 60', filename: entity, options },

    // The file that declares a name, from any layer and from a file of none.
    { code: "import { UsersService } from '@/accounts/users/services/users.service'", filename: entity, options },
    { code: "import { UsersService } from '@/accounts/users/services/users.service'", filename: moduleFile, options },
    { code: "export * from '@/accounts/users/services/users.service'", filename: entity, options },

    // A specifier that names a file whose stem is index, under another extension, names that file.
    { code: "import { page } from '@/accounts/users/services/index.page'", filename: entity, options },

    // A file beside the directory takes the path, so the import loads that file and never the barrel.
    { code: "import { PLAN_LIMIT } from '@/accounts/plans'", filename: entity, options },

    // A directory with no index file is no barrel.
    { code: "import { SessionEntity } from '@/accounts/tokens/entities'", filename: entity, options },
    // A directory whose index file declares code is a module, so importing it loads that file alone.
    { code: "import { SESSION_TTL } from '@/accounts/sessions'", filename: entity, options },

    // A barrel re-exports its siblings, so it answers to none of this.
    {
      code: "export * from './token.entity.js'",
      filename: buildSourcePath('accounts', 'tokens', 'entities', 'index.ts'),
      options,
    },
    {
      code: "import TokenEntity from './token.entity.js'\n\nexport default TokenEntity;;",
      filename: buildSourcePath('accounts', 'tokens', 'entities', 'index.ts'),
      options,
    },
    {
      code: "'use client'\n\nimport { TokenEntity } from './token.entity.js'\n\nexport { TokenEntity }",
      filename: buildSourcePath('accounts', 'tokens', 'entities', 'index.ts'),
      options,
    },

    // A package is none of the rule's business.
    { code: "import { Injectable } from '@nestjs/common'", filename: entity, options },

    // A test reaches another test, which is what a suite is made of.
    {
      code: "import { buildToken } from '@/accounts/tokens/__tests__/factories/token.factory'",
      filename: spec,
      options,
    },
  ],
  invalid: [
    // With no type information, the barrel is reported and the import is left as written.
    {
      code: "import { UsersService } from '@/accounts/users/services'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport', data: { specifier: '@/accounts/users/services' } }],
    },
    {
      code: "export { UsersService } from '@/accounts/users/services'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    {
      code: "export * from '@/accounts/users/services'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    // A barrel in the test tree loads every helper into every spec, the way a barrel of a layer does.
    {
      code: "import { buildToken } from '@/accounts/tokens/__tests__/factories'",
      filename: spec,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    {
      code: "import { x } from './session.entity'",
      filename: entity,
      options,
      errors: [{ messageId: 'relativeImport' }],
    },
    // An index file that declares code is a module, so it is judged like any other file.
    {
      code: "import { x } from './session.entity'\n\nexport const TOKEN_TTL = x",
      filename: buildSourcePath('accounts', 'tokens', 'entities', 'index.ts'),
      options,
      errors: [{ messageId: 'relativeImport' }],
    },
    // An index file named by name is the barrel its directory names.
    {
      code: "import { UsersService } from '@/accounts/users/services/index'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    {
      code: "import { UsersService } from '@/accounts/users/services/index.js'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    // A directive, an import passed on by name, and a namespace passed on whole still make a barrel.
    {
      code: "import { Client } from '@/accounts/clients'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    {
      code: "import { RoleEntity } from '@/accounts/roles'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    {
      code: "import { GroupEntity } from '@/accounts/groups'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    {
      code: "import { teams } from '@/accounts/teams'",
      filename: entity,
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
    {
      code: "import { buildToken } from '@/accounts/tokens/__tests__/factories'",
      filename: entity,
      options,
      errors: [{ messageId: 'testFromProduction' }],
    },
  ],
})

const testingOptions: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    alias: '@',
    suffixToFolder: { entity: 'entities', service: 'services', spec: '__tests__', type: 'types' },
    testFolder: '__tests__',
    testingFolder: 'testing',
    developmentSuffixes: ['stories'],
  },
]
const doc = buildSourcePath('activities', 'docs', 'find-all-activities.doc.ts')

ruleTester.run('import-boundaries, on a testing folder', importBoundaries, {
  valid: [
    // A spec builds its fixtures out of a package's testing entrypoint.
    {
      code: "import { buildPaginatedEntity } from '@acme/nestjs/database/testing'",
      filename: spec,
      options: testingOptions,
    },

    // A spec written outside the test tree is still test code.
    {
      code: "import { buildRecord } from '@/database/testing'",
      filename: buildSourcePath('database', 'records.spec.ts'),
      options: testingOptions,
    },

    // A testing folder is built out of other testing folders.
    {
      code: "import { buildRecord } from '@acme/nestjs/database/testing'",
      filename: buildSourcePath('database', 'testing', 'utils', 'mock-transaction.util.ts'),
      options: testingOptions,
    },

    // A story is loaded by the catalog, never by the application.
    {
      code: "import { UserFactory } from '@acme/sdk/testing'",
      filename: buildSourcePath('settings', 'components', 'language-section.stories.tsx'),
      options: testingOptions,
    },

    // A package named after testing is a package, not a testing entrypoint of one.
    { code: "import { Test } from '@nestjs/testing'", filename: doc, options: testingOptions },

    // The runtime entrypoint of the same package.
    {
      code: "import { buildPaginatedEntity } from '@acme/nestjs/database'",
      filename: doc,
      options: testingOptions,
    },

    // With no testing folder named, the rule judges none.
    { code: "import { x } from 'some-package/testing'", filename: doc, options },
  ],
  invalid: [
    {
      code: "import { buildPaginatedEntity } from '@acme/nestjs/database/testing'",
      filename: doc,
      options: testingOptions,
      errors: [{ messageId: 'testingFromProduction' }],
    },
    // With no development suffix named, a story is production code.
    {
      code: "import { UserFactory } from '@acme/sdk/testing'",
      filename: buildSourcePath('settings', 'components', 'language-section.stories.tsx'),
      options: [{ ...testingOptions[0], developmentSuffixes: [] }],
      errors: [{ messageId: 'testingFromProduction' }],
    },
    {
      code: "import { render } from 'some-package/testing'",
      filename: doc,
      options: testingOptions,
      errors: [{ messageId: 'testingFromProduction' }],
    },
    {
      code: "import { buildRecord } from '@/database/testing'",
      filename: doc,
      options: testingOptions,
      errors: [{ messageId: 'testingFromProduction' }],
    },
    {
      code: "export * from '@/database/testing/records.table'",
      filename: doc,
      options: testingOptions,
      errors: [{ messageId: 'testingFromProduction' }],
    },
  ],
})

const mockOptions: [ArchitectureOptions] = [{ ...testingOptions[0], mockFolder: '__mocks__' }]
const mock = buildSourcePath('accounts', 'tokens', 'services', '__mocks__', 'tokens.service.ts')

ruleTester.run('import-boundaries, on a mock folder', importBoundaries, {
  valid: [
    // A stand-in takes its types from the module it replaces, by name, as a spec does.
    {
      code: "import type { UsersService } from '@/accounts/users/services/users.service'",
      filename: mock,
      options: mockOptions,
    },

    // A stand-in is built from what a test is built from.
    { code: "import { buildRecord } from '@acme/nestjs/database/testing'", filename: mock, options: mockOptions },
    {
      code: "import { buildToken } from '@/accounts/tokens/__tests__/factories/token.factory'",
      filename: mock,
      options: mockOptions,
    },

    // A spec reaches a stand-in, which is what the test tree is made of.
    {
      code: "import { TokensService } from '@/accounts/tokens/services/__mocks__/tokens.service'",
      filename: spec,
      options: mockOptions,
    },

    // With no mock folder named, the stand-in is a file like any other.
    {
      code: "import { TokensService } from '@/accounts/tokens/services/__mocks__/tokens.service'",
      filename: entity,
      options: testingOptions,
    },
  ],
  invalid: [
    // Production code reaches the module, and the test runner decides when the stand-in replaces it.
    {
      code: "import { TokensService } from '@/accounts/tokens/services/__mocks__/tokens.service'",
      filename: entity,
      options: mockOptions,
      errors: [{ messageId: 'testFromProduction' }],
    },
  ],
})

ruleTester.run('import-boundaries, in a repository of several packages', importBoundaries, {
  valid: [
    // A file with no `src` in its path belongs to no package's sources.
    {
      code: "import { UsersService } from '@/accounts/users/services'",
      filename: 'packages/x/entities/token.entity.ts',
      options,
    },
  ],
  invalid: [
    // The alias reaches the sources of the file's own package, where the barrel is looked for.
    {
      code: "import { UsersService } from '@/accounts/users/services'",
      filename: buildPackageSourcePath('packages/x', 'accounts', 'tokens', 'entities', 'token.entity.ts'),
      options,
      errors: [{ messageId: 'barrelImport' }],
    },
  ],
})

const publishedRoot = buildFixturePath(import.meta.url, 're-export-only-at-entrypoint-published')
const publishedRuleTester = createFileRuleTester(publishedRoot)

publishedRuleTester.run('import-boundaries, on a published entrypoint', importBoundaries, {
  valid: [
    // A directory whose index file the package publishes is an entrypoint, not a barrel, so an import may name it.
    { code: 'import * as users from "@/users"', filename: buildSourcePath('app', 'app.ts'), options },
    { code: 'import * as users from "@/schemas/users"', filename: buildSourcePath('app', 'app.ts'), options },
    // A published entrypoint re-exports what the package offers, whatever its name.
    { code: 'export * from "./build-record.util.js"', filename: buildSourcePath('testing.ts'), options },
  ],
  invalid: [
    // Its imports are judged like those of any other file.
    {
      code: 'export * from "./build-record.util.js"\nimport { read } from "./read.util.js"',
      filename: buildSourcePath('testing.ts'),
      options,
      errors: [{ messageId: 'relativeImport', line: 2 }],
    },
    // The index file at the source root keeps its re-exports, and its imports are judged like any other file's.
    {
      code: 'export * from "./users/index.js"\nimport { buildRecord } from "@/cache/keyv/testing/build-record.util"',
      filename: buildSourcePath('index.ts'),
      options: testingOptions,
      errors: [{ messageId: 'testingFromProduction', line: 2 }],
    },
    // A file the package does not publish is judged in full.
    {
      code: 'export * from "./build-record.util.js"',
      filename: buildSourcePath('users', 'users.util.ts'),
      options,
      errors: [{ messageId: 'relativeImport' }],
    },
  ],
})
