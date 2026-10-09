import {
  buildPackageSourcePath,
  buildSourcePath,
  createSyntaxRuleTester,
  extendRuleOptions,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { importBoundaries } from '../../../rules/import-boundaries.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

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
    // Another layer, through its barrel.
    { code: "import { UsersService } from '@/accounts/users/services'", filename: entity, options },

    // A sibling of the same layer, by name.
    { code: "import { SessionEntity } from '@/accounts/tokens/entities/session.entity'", filename: entity, options },

    // A barrel re-exports its siblings, so it answers to none of this.
    {
      code: "export * from './token.entity.js'",
      filename: buildSourcePath('accounts', 'tokens', 'entities', 'index.ts'),
      options,
    },

    // A file carrying no layer suffix reaches every layer through a barrel.
    { code: "import { TokensService } from '@/accounts/tokens/services'", filename: moduleFile, options },

    // A file with no suffix at all reaches a layer through its barrel, like any unsuffixed file.
    {
      code: "import { TokensService } from '@/accounts/tokens/services'",
      filename: buildSourcePath('main.ts'),
      options,
    },

    // A package is none of the rule's business.
    { code: "import { Injectable } from '@nestjs/common'", filename: entity, options },

    // A test reaches another test, which is what a suite is made of.
    { code: "import { build } from '@/accounts/tokens/__tests__/factories'", filename: spec, options },

    // With no vocabulary, the rule judges nothing.
    {
      code: "import { x } from './y'",
      filename: entity,
      options: extendRuleOptions([EMPTY_OPTIONS], { alias: '@', suffixToFolder: {} }),
    },
  ],
  invalid: [
    {
      code: "import { UsersService } from '@/accounts/users/services/users.service'",
      filename: entity,
      options,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
    {
      code: "import { OtherEntity } from '@/accounts/users/entities/user.entity'",
      filename: entity,
      options,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
    {
      code: "import { SessionEntity } from '@/accounts/tokens/entities'",
      filename: entity,
      options,
      errors: [{ messageId: 'sameLayerNeedsDirect' }],
    },
    {
      code: "import { SessionEntity } from '@/accounts/tokens/entities/index'",
      filename: entity,
      options,
      errors: [{ messageId: 'sameLayerNeedsDirect' }],
    },
    {
      code: "import { x } from './session.entity'",
      filename: entity,
      options,
      errors: [{ messageId: 'relativeImport' }],
    },
    {
      code: "import { TokensService } from '@/accounts/tokens/services/tokens.service'",
      filename: moduleFile,
      options,
      errors: [{ messageId: 'layerNeedsBarrel' }],
    },
    {
      code: "import { build } from '@/accounts/tokens/__tests__/factories'",
      filename: entity,
      options,
      errors: [{ messageId: 'testFromProduction' }],
    },
    {
      code: "export { UsersService } from '@/accounts/users/services/users.service'",
      filename: entity,
      options,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
    {
      code: "export * from '@/accounts/users/services/users.service'",
      filename: entity,
      options,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
  ],
})

ruleTester.run('import-boundaries, on a file the map does not place', importBoundaries, {
  valid: [
    // A suffix the map names, in a folder it does not: the file belongs to no layer here.
    {
      code: "import { SessionEntity } from '@/accounts/tokens/entities'",
      filename: buildSourcePath('accounts', 'tokens', 'token.entity.ts'),
      options,
    },
  ],
  invalid: [
    // A suffix the map does not name belongs to no layer, so it reaches every layer through a barrel.
    {
      code: "import { UsersService } from '@/accounts/users/services/users.service'",
      filename: buildSourcePath('accounts', 'tokens', 'widgets', 'token.widget.ts'),
      options,
      errors: [{ messageId: 'layerNeedsBarrel' }],
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
    // A spec builds its fixtures out of a package's testing entry.
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

    // A package named after testing is a package, not a testing entry of one.
    { code: "import { Test } from '@nestjs/testing'", filename: doc, options: testingOptions },

    // The runtime entry of the same package.
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

ruleTester.run('import-boundaries, from the test tree', importBoundaries, {
  valid: [
    // A spec names the file it covers: the barrel re-exports what the spec is isolating.
    {
      code: "import { TokensService } from '@/accounts/tokens/services/tokens.service'",
      filename: buildSourcePath('accounts', 'tokens', '__tests__', 'unit', 'tokens.service.spec.ts'),
      options,
    },
  ],
  invalid: [],
})

const mockOptions: [ArchitectureOptions] = [{ ...testingOptions[0], mockFolder: '__mocks__' }]
const mock = buildSourcePath('accounts', 'tokens', 'services', '__mocks__', 'tokens.service.ts')

ruleTester.run('import-boundaries, on a mock folder', importBoundaries, {
  valid: [
    // A stand-in takes its types from the module of another layer it replaces, by name, as a spec does.
    {
      code: "import type { UsersService } from '@/accounts/users/services/users.service'",
      filename: mock,
      options: mockOptions,
    },

    // A stand-in is built from what a test is built from.
    { code: "import { buildRecord } from '@acme/nestjs/database/testing'", filename: mock, options: mockOptions },
    { code: "import { build } from '@/accounts/tokens/__tests__/factories'", filename: mock, options: mockOptions },

    // A spec reaches a stand-in, which is what the test tree is made of.
    {
      code: "import { TokensService } from '@/accounts/tokens/services/__mocks__/tokens.service'",
      filename: spec,
      options: mockOptions,
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
    // With no mock folder named, the stand-in is production code.
    {
      code: "import { UsersService } from '@/accounts/users/services/users.service'",
      filename: mock,
      options: testingOptions,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
  ],
})

ruleTester.run('import-boundaries, in a repository of several packages', importBoundaries, {
  valid: [
    // A file with no `src` in its path belongs to no package's sources.
    {
      code: "import { UsersService } from '@/accounts/users/services/users.service'",
      filename: 'packages/x/entities/token.entity.ts',
      options,
    },
  ],
  invalid: [
    {
      code: "import { UsersService } from '@/accounts/users/services/users.service'",
      filename: buildPackageSourcePath('packages/x', 'accounts', 'tokens', 'entities', 'token.entity.ts'),
      options,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
  ],
})
