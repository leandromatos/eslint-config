import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { resultByVerb } from '../../../rules/result-by-verb.rule.js'
import type { NamingOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [NamingOptions] = [
  {
    ...EMPTY_OPTIONS,
    verbParticiples: { hash: 'hashed', create: 'created', to: 'transformed' },
    roleNames: ['result', 'expected'],
    testFolder: '__tests__',
  },
]
const source = sourceFile('users', 'services', 'user.service.ts')
const spec = sourceFile('users', '__tests__', 'user.service.spec.ts')
const component = sourceFile('users', 'components', 'user-card.tsx')

ruleTester.run('result-by-verb', resultByVerb, {
  valid: [
    // A call on something the chain does not name produces nothing this rule can read.
    { code: 'const password = hashers[0](raw)', filename: source, options },

    // A name the scope already holds is left alone: two results of one verb are told apart by hand.
    { code: 'const hashedPassword = 1\nconst password = hashPassword(raw)', filename: source, options },
    // A name that leaves as a shorthand property is fixed by the key, which is the reader's contract.
    { code: 'const password = hashPassword(raw)\n\nexport const built = { password }', filename: source, options },
    // A name the render opens an element with keeps its case: JSX reads a lowercase one as a tag of the language.
    {
      code: 'const ThemeContext = createContext(null)\n\nexport const Provider = () => <ThemeContext value={1} />',
      filename: component,
      options,
    },
    // A name a list at the end of the file carries out of the module is the module's, not this file's.
    { code: 'const password = hashPassword(raw)\nexport { password }', filename: source, options },
    // A verb the options do not list produces nothing new.
    { code: 'const userEntity = readUser(id)', filename: source, options },

    { code: 'const hashedPassword = hashPassword(password)', filename: source, options },
    { code: 'const createdToken = createToken(body)', filename: source, options },
    { code: 'const userEntity = findOneUser(id)', filename: source, options },
    { code: 'export const hash = hashPassword(password)', filename: source, options },
    { code: 'const result = hashPassword(password)', filename: spec, options },
    { code: 'const expectedPassword = hashPassword(password)', filename: spec, options },
  ],
  invalid: [
    // A participle of another verb is replaced, not stacked under, and a method call is read like a bare one.
    {
      code: 'const createdPassword = this.hasher.hashPassword(raw)',
      filename: source,
      options,
      errors: [{ messageId: 'missingParticiple' }],
      output: 'const hashedPassword = this.hasher.hashPassword(raw)',
    },
    // What a verb produced is read past the await.
    {
      code: 'const read = async () => {\n  const password = await hashPassword(raw)\n\n  return password\n}',
      filename: source,
      options,
      errors: [{ messageId: 'missingParticiple' }],
      output:
        'const read = async () => {\n  const hashedPassword = await hashPassword(raw)\n\n  return hashedPassword\n}',
    },

    {
      code: 'const password = hashPassword(raw)',
      filename: source,
      options,
      errors: [{ messageId: 'missingParticiple' }],
      output: 'const hashedPassword = hashPassword(raw)',
    },
    {
      code: 'const result = hashPassword(raw)',
      filename: source,
      options,
      errors: [{ messageId: 'missingParticiple' }],
      output: 'const hashedResult = hashPassword(raw)',
    },
    {
      code: 'const activityEntity = toActivityEntity(activity)',
      filename: source,
      options,
      errors: [{ messageId: 'missingParticiple' }],
      output: 'const transformedActivityEntity = toActivityEntity(activity)',
    },
  ],
})
