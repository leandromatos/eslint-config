import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { e2eOverHttp } from '../../../rules/e2e-over-http.rule.js'
import type { TestingOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TestingOptions] = [
  {
    ...EMPTY_OPTIONS,
    testFolder: '__tests__',
    testKinds: ['unit', 'e2e'],
    suffixToFolder: { spec: '__tests__' },
    httpTest: { kind: 'e2e', client: 'supertest' },
  },
]
const e2e = sourceFile('users', '__tests__', 'e2e', 'users.spec.ts')

ruleTester.run('e2e-over-http', e2eOverHttp, {
  valid: [
    // A spec that imports something else still has to import the client.
    {
      code: "import { bootApplication } from './utils/index.js'\n\nexport const send = () => bootApplication",
      options,
      filename: sourceFile('users', '__tests__', 'unit', 'user.service.spec.ts'),
    },

    // With no HTTP kind declared, no spec is judged by what it imports.
    { code: 'export const read = () => 1', filename: e2e, options: [{ ...EMPTY_OPTIONS, testFolder: '__tests__' }] },

    { code: "import request from 'supertest'\n\nexport const send = () => request", options, filename: e2e },
    {
      code: 'export const bootApplication = () => 1',
      options,
      filename: sourceFile('users', '__tests__', 'e2e', 'utils', 'application-boot.util.ts'),
    },
    {
      code: 'export const read = () => 1',
      options,
      filename: sourceFile('users', '__tests__', 'unit', 'user.service.spec.ts'),
    },
  ],
  invalid: [
    // A spec that imports something else, and not the client, sends nothing.
    {
      code: "import { bootApplication } from './utils/index.js'\n\nexport const send = () => bootApplication",
      options,
      filename: e2e,
      errors: [{ messageId: 'noRequest' }],
    },
    { code: 'export const read = () => 1', options, filename: e2e, errors: [{ messageId: 'noRequest' }] },
  ],
})
