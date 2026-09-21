import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { expectedPrefix } from '../../../rules/expected-prefix.rule.js'
import type { NamingOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [NamingOptions] = [
  {
    ...EMPTY_OPTIONS,
    assertionMatchers: ['toEqual', 'toMatchObject'],
    verbParticiples: { build: 'built' },
    testFolder: '__tests__',
  },
]
const spec = sourceFile('users', '__tests__', 'user.service.spec.ts')

ruleTester.run('expected-prefix', expectedPrefix, {
  valid: [
    // A matcher reached through a chain is the same assertion.
    { code: 'const expectedUser = {}\nexpect(result).resolves.toEqual(expectedUser)', filename: spec, options },

    // A chain that does not start at `expect` is no assertion of this suite.
    { code: 'const user = {}\ncheck(result).toEqual(user)', filename: spec, options },
    { code: 'const user = {}\nexpect.soft(result).toEqual(user)', filename: spec, options },

    { code: 'const expectedUser = {}\nexpect(result).toEqual(expectedUser)', filename: spec, options },
    { code: 'expect(result).toEqual({ id: 1 })', filename: spec, options },
    { code: 'const user = {}\nexpect(result).toBe(user)', filename: spec, options },
    { code: 'const USERS = []\nexpect(result).toEqual(USERS)', filename: spec, options },
    {
      code: 'const user = {}\nexpect(result).toEqual(user)',
      filename: sourceFile('users', 'services', 'user.service.ts'),
      options,
    },
  ],
  invalid: [
    // A reference that leaves as a shorthand property is written out by the rename.
    {
      code: 'const user = {}\nexpect(result).toEqual(user)\nexport const payload = { user }',
      filename: spec,
      options,
      errors: [{ messageId: 'missingPrefix' }],
      output:
        'const expectedUser = {}\nexpect(result).toEqual(expectedUser)\nexport const payload = { user: expectedUser }',
    },

    // A name a parameter declares is reported and left alone: the rename is the caller's to make.
    {
      code: 'const read = (user) => {\n  expect(result).toEqual(user)\n}',
      filename: spec,
      options,
      errors: [{ messageId: 'missingPrefix' }],
      output: null,
    },
    // The name the rule would propose is already taken, so it reports and writes nothing.
    {
      code: 'const expectedUser = {}\nconst user = {}\nexpect(result).toEqual(user)',
      filename: spec,
      options,
      errors: [{ messageId: 'missingPrefix' }],
      output: null,
    },

    {
      code: 'const user = {}\nexpect(result).toEqual(user)',
      filename: spec,
      options,
      errors: [{ messageId: 'missingPrefix' }],
      output: 'const expectedUser = {}\nexpect(result).toEqual(expectedUser)',
    },
    {
      code: 'const builtUser = {}\nexpect(result).toMatchObject(builtUser)',
      filename: spec,
      options,
      errors: [{ messageId: 'missingPrefix' }],
      output: 'const expectedUser = {}\nexpect(result).toMatchObject(expectedUser)',
    },
  ],
})
