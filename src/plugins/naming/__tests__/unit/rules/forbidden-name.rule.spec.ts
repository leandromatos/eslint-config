import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { forbiddenName } from '../../../rules/forbidden-name.rule.js'
import type { NamingOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()
const options: [NamingOptions] = [{ ...EMPTY_OPTIONS, forbiddenNames: ['data'] }]
const source = sourceFile('users', 'users.service.ts')

ruleTester.run('forbidden-name', forbiddenName, {
  valid: [
    // A key of an object literal is half of a contract, and `context.report({ data })` spells what ESLint asked for.
    { code: "report({ node, messageId: 'x', data: { name } })", filename: source, options },
    // A shorthand key is the same contract, written shorter.
    { code: 'const payload = { a: 1 }\nreport({ data: payload })', filename: source, options },
    // Reading a property nobody here declared says nothing about how it was named.
    { code: 'const rows = response.data', filename: source, options },
    // A name the options do not forbid is the author's to choose.
    { code: 'const records = read()', filename: source, options },
    // A destructured parameter declares the keys of what it takes apart, which the contract named.
    { code: 'const read = ({ data }: { data: string }) => data', filename: source, options },
    // A key destructured from a variable is the same: the object decided the word.
    { code: 'const payload = { data: 1 }\nconst { data } = payload', filename: source, options },
  ],
  invalid: [
    {
      code: 'const data = read()',
      filename: source,
      options,
      errors: [{ messageId: 'forbidden' }],
    },
    {
      code: 'const read = (data: string) => data',
      filename: source,
      options,
      errors: [{ messageId: 'forbidden' }],
    },
    // A default does not change who chose the name.
    {
      code: "const read = (data = 'x') => data",
      filename: source,
      options,
      errors: [{ messageId: 'forbidden' }],
    },
    {
      code: 'function data() {}',
      filename: source,
      options,
      errors: [{ messageId: 'forbidden' }],
    },
    {
      code: 'class Store {\n  data = 1\n}',
      filename: source,
      options,
      errors: [{ messageId: 'forbidden' }],
    },
  ],
})
