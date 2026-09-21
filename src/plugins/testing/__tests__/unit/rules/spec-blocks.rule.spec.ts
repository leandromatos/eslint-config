import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { specBlocks } from '../../../rules/spec-blocks.rule.js'
import type { TestingOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TestingOptions] = [{ ...EMPTY_OPTIONS, testFolder: '__tests__' }]
const spec = sourceFile('users', '__tests__', 'unit', 'user.service.spec.ts')

ruleTester.run('spec-blocks', specBlocks, {
  valid: [
    // A comment that labels nothing is a note like any other.
    {
      code: "it('reads one user', () => {\n  // the identifier the route carries\n  const id = '1'\n\n  expect(read(id)).toBe(id)\n})",
      options,
      filename: spec,
    },

    // An assertion written outside every block the body splits into is not the act's neighbour.
    { code: "it('reads one user', () => {\n  if (ready) expect(read()).toBe(1)\n})", options, filename: spec },

    // A test call written without a body, or with something that is not a function, holds no blocks.
    { code: "it('reads one user')", options, filename: spec },
    { code: "it('reads one user', 1)", options, filename: spec },
    { code: "it('reads one user', () => read())", options, filename: spec },
    // A body that asserts nothing has no assert block to open.
    { code: "it('reads one user', () => {\n  read()\n})", options, filename: spec },
    // An assertion awaited, and a call that is not an assertion, are told apart.
    {
      code: "it('reads one user', async () => {\n  await expect(read()).resolves.toBe(1)\n})",
      options,
      filename: spec,
    },
    { code: "it('reads one user', () => {\n  check(read()).toBe(1)\n})", options, filename: spec },

    {
      code: "it('reads one user', async () => {\n  const id = '1'\n\n  const userEntity = await read(id)\n\n  expect(userEntity.id).toBe(id)\n})",
      options,
      filename: spec,
    },
    { code: "it('reads one user', () => {\n  expect(read('1')).toBe('1')\n})", options, filename: spec },
    {
      code: "it('reads one user', () => {\n  // arrange\n  const id = '1'\n\n  expect(read(id)).toBe(id)\n})",
      options,
      filename: sourceFile('users', 'services', 'user.service.ts'),
    },
  ],
  invalid: [
    {
      code: "it('reads one user', async () => {\n  const userEntity = await read('1')\n  expect(userEntity.id).toBe('1')\n})",
      options,
      filename: spec,
      errors: [{ messageId: 'assertJoinsAct' }],
      output:
        "it('reads one user', async () => {\n  const userEntity = await read('1')\n\n  expect(userEntity.id).toBe('1')\n})",
    },
    {
      code: "it('reads one user', async () => {\n  const id = '1'\n\n  const name = 'name'\n\n  const userEntity = await read(id)\n\n  expect(userEntity.id).toBe(id)\n})",
      options,
      filename: spec,
      errors: [{ messageId: 'tooManyBlocks' }],
    },
    {
      code: "it('reads one user', () => {\n  // arrange\n  const id = '1'\n\n  expect(read(id)).toBe(id)\n})",
      options,
      filename: spec,
      errors: [{ messageId: 'labelComment' }],
    },
  ],
})
