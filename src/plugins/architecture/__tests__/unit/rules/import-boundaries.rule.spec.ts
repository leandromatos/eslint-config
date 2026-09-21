import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { importBoundaries } from '../../../rules/import-boundaries.rule.js'
import type { ArchitectureOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [ArchitectureOptions] = [
  {
    ...EMPTY_OPTIONS,
    alias: '@',
    suffixToFolder: { entity: 'entities', service: 'services', type: 'types' },
    testFolder: '__tests__',
  },
]
const entity = sourceFile('authorizer', 'tokens', 'entities', 'token.entity.ts')
const module_ = sourceFile('authorizer', 'tokens', 'tokens.module.ts')
const spec = sourceFile('authorizer', 'tokens', '__tests__', 'unit', 'tokens.service.spec.ts')

ruleTester.run('import-boundaries', importBoundaries, {
  valid: [
    // Another layer, through its barrel.
    { code: "import { UsersService } from '@/authorizer/users/services'", filename: entity, options },

    // A sibling of the same layer, by name.
    { code: "import { SessionEntity } from '@/authorizer/tokens/entities/session.entity'", filename: entity, options },

    // A barrel re-exports its siblings, so it answers to none of this.
    {
      code: "export * from './token.entity.js'",
      filename: sourceFile('authorizer', 'tokens', 'entities', 'index.ts'),
      options,
    },

    // A file carrying no layer suffix reaches every layer through a barrel.
    { code: "import { TokensService } from '@/authorizer/tokens/services'", filename: module_, options },

    // A file with no suffix at all reaches a layer through its barrel, like any unsuffixed file.
    { code: "import { TokensService } from '@/authorizer/tokens/services'", filename: sourceFile('main.ts'), options },

    // A package is none of the rule's business.
    { code: "import { Injectable } from '@nestjs/common'", filename: entity, options },

    // A test reaches another test, which is what a suite is made of.
    { code: "import { build } from '@/authorizer/tokens/__tests__/factories'", filename: spec, options },

    // With no vocabulary, the rule judges nothing.
    {
      code: "import { x } from './y'",
      filename: entity,
      options: [{ ...EMPTY_OPTIONS, alias: '@', suffixToFolder: {} }] as [ArchitectureOptions],
    },
  ],
  invalid: [
    {
      code: "import { UsersService } from '@/authorizer/users/services/users.service'",
      filename: entity,
      options,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
    {
      code: "import { OtherEntity } from '@/authorizer/users/entities/user.entity'",
      filename: entity,
      options,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
    {
      code: "import { SessionEntity } from '@/authorizer/tokens/entities'",
      filename: entity,
      options,
      errors: [{ messageId: 'sameLayerNeedsDirect' }],
    },
    {
      code: "import { SessionEntity } from '@/authorizer/tokens/entities/index'",
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
      code: "import { TokensService } from '@/authorizer/tokens/services/tokens.service'",
      filename: module_,
      options,
      errors: [{ messageId: 'layerNeedsBarrel' }],
    },
    {
      code: "import { build } from '@/authorizer/tokens/__tests__/factories'",
      filename: entity,
      options,
      errors: [{ messageId: 'testFromProduction' }],
    },
    {
      code: "export { UsersService } from '@/authorizer/users/services/users.service'",
      filename: entity,
      options,
      errors: [{ messageId: 'crossLayerNeedsBarrel' }],
    },
    {
      code: "export * from '@/authorizer/users/services/users.service'",
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
      code: "import { SessionEntity } from '@/authorizer/tokens/entities'",
      filename: sourceFile('authorizer', 'tokens', 'token.entity.ts'),
      options,
    },
  ],
  invalid: [
    // A suffix the map does not name belongs to no layer, so it reaches every layer through a barrel.
    {
      code: "import { UsersService } from '@/authorizer/users/services/users.service'",
      filename: sourceFile('authorizer', 'tokens', 'widgets', 'token.widget.ts'),
      options,
      errors: [{ messageId: 'layerNeedsBarrel' }],
    },
  ],
})

ruleTester.run('import-boundaries, from the test tree', importBoundaries, {
  valid: [
    // A spec names the file it covers: the barrel re-exports what the spec is isolating.
    {
      code: "import { TokensService } from '@/authorizer/tokens/services/tokens.service'",
      filename: sourceFile('authorizer', 'tokens', '__tests__', 'unit', 'tokens.service.spec.ts'),
      options,
    },
  ],
  invalid: [],
})
