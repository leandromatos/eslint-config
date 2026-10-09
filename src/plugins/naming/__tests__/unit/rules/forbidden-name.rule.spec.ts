import { buildSourcePath, createSyntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { forbiddenName } from '../../../rules/forbidden-name.rule.js'
import type { NamingOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()
const because = 'it names no content'
const options: [NamingOptions] = [{ ...EMPTY_OPTIONS, forbiddenNames: [{ name: 'data', because }] }]
const wordOptions: [NamingOptions] = [{ ...EMPTY_OPTIONS, forbiddenWords: [{ word: 'data', because }] }]
const suffixOptions: [NamingOptions] = [
  { ...EMPTY_OPTIONS, forbiddenWords: [{ word: 'data', because, position: 'last' }] },
]
const source = buildSourcePath('users', 'users.service.ts')

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
    // A whole name the options forbid says nothing about the words of a longer one.
    { code: 'const userData = read()', filename: source, options },
    // A word is a segment of the name, so the letters inside another word are not it.
    { code: 'const metadata = read()', filename: source, options: wordOptions },
    // A word refused as the suffix is left alone in any other position.
    { code: 'const healthDataSharing = read()', filename: source, options: suffixOptions },
    // A computed key is an expression, not a name anybody chose.
    { code: 'class Store {\n  [data] = 1\n}', filename: source, options: wordOptions },
  ],
  invalid: [
    {
      code: 'const data = read()',
      filename: source,
      options,
      errors: [{ messageId: 'forbiddenName' }],
    },
    {
      code: 'const read = (data: string) => data',
      filename: source,
      options,
      errors: [{ messageId: 'forbiddenName' }],
    },
    // A default does not change who chose the name.
    {
      code: "const read = (data = 'x') => data",
      filename: source,
      options,
      errors: [{ messageId: 'forbiddenName' }],
    },
    {
      code: 'function data() {}',
      filename: source,
      options,
      errors: [{ messageId: 'forbiddenName' }],
    },
    {
      code: 'class Store {\n  data = 1\n}',
      filename: source,
      options,
      errors: [{ messageId: 'forbiddenName' }],
    },
    // A parameter property declares a field of the class as much as a parameter.
    {
      code: 'class Store {\n  constructor(private readonly data: string) {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'forbiddenName' }],
    },
    // A word is found in every case a name is written in.
    ...['userData', 'UserData', 'user_data', 'DATA'].map(name => ({
      code: `const ${name} = read()`,
      filename: source,
      options: wordOptions,
      errors: [{ messageId: 'forbiddenWord' as const, data: { name, word: 'data', because } }],
    })),
    {
      code: 'interface UserData {\n  rawData: string\n}',
      filename: source,
      options: wordOptions,
      errors: [{ messageId: 'forbiddenWord' }, { messageId: 'forbiddenWord' }],
    },
    {
      code: 'type UserData = string',
      filename: source,
      options: wordOptions,
      errors: [{ messageId: 'forbiddenWord' }],
    },
    {
      code: 'class Store {\n  readData() {}\n}',
      filename: source,
      options: wordOptions,
      errors: [{ messageId: 'forbiddenWord' }],
    },
    {
      code: 'declare function readData(): void',
      filename: source,
      options: wordOptions,
      errors: [{ messageId: 'forbiddenWord' }],
    },
    {
      code: 'const builtHealthData = read()',
      filename: source,
      options: suffixOptions,
      errors: [{ messageId: 'forbiddenWord' }],
    },
  ],
})
