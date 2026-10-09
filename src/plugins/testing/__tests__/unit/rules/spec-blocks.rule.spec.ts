import {
  buildPackageSourcePath,
  buildSourcePath,
  createSyntaxRuleTester,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { specBlocks } from '../../../rules/spec-blocks.rule.js'
import type { TestingOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

const options: [TestingOptions] = [{ ...EMPTY_OPTIONS, testFolder: '__tests__' }]
const spec = buildSourcePath('users', '__tests__', 'unit', 'user.service.spec.ts')

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

    /*
     * A group, a hook and a step hang off the test call without being a test, so their bodies take any number of
     * blocks.
     */
    {
      code: "test.describe('users', () => {\n  test.describe.configure({ mode: 'serial' })\n\n  test.beforeEach(() => seed())\n\n  test('reads', () => {})\n\n  test('writes', () => {})\n})",
      options,
      filename: spec,
    },
    {
      code: "test.beforeEach(async () => {\n  await a()\n\n  await b()\n\n  await c()\n\n  await d()\n})\ntest['describe']('users', () => {\n  a()\n\n  b()\n\n  c()\n\n  d()\n})",
      options,
      filename: spec,
    },
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
      filename: buildSourcePath('users', 'services', 'user.service.ts'),
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
    // A table of cases is a test like any other, and so is a test run alone.
    {
      code: "it.each([['1']])('reads user %s', async (id) => {\n  const userEntity = await read(id)\n  expect(userEntity.id).toBe(id)\n})",
      options,
      filename: spec,
      errors: [{ messageId: 'assertJoinsAct' }],
      output:
        "it.each([['1']])('reads user %s', async (id) => {\n  const userEntity = await read(id)\n\n  expect(userEntity.id).toBe(id)\n})",
    },
    {
      code: "test.only('reads one user', async () => {\n  const userEntity = await read('1')\n  expect(userEntity.id).toBe('1')\n})",
      options,
      filename: spec,
      errors: [{ messageId: 'assertJoinsAct' }],
      output:
        "test.only('reads one user', async () => {\n  const userEntity = await read('1')\n\n  expect(userEntity.id).toBe('1')\n})",
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

ruleTester.run('spec-blocks, in a repository of several packages', specBlocks, {
  valid: [
    // A file with no `src` in its path belongs to no package's sources.
    {
      code: "it('reads one user', async () => {\n  const userEntity = await read('1')\n  expect(userEntity.id).toBe('1')\n})",
      filename: 'packages/x/__tests__/unit/user.service.spec.ts',
      options,
    },
  ],
  invalid: [
    {
      code: "it('reads one user', async () => {\n  const userEntity = await read('1')\n  expect(userEntity.id).toBe('1')\n})",
      filename: buildPackageSourcePath('packages/x', 'users', '__tests__', 'unit', 'user.service.spec.ts'),
      options,
      errors: [{ messageId: 'assertJoinsAct' }],
      output:
        "it('reads one user', async () => {\n  const userEntity = await read('1')\n\n  expect(userEntity.id).toBe('1')\n})",
    },
  ],
})
