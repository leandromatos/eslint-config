import { sourceFile, syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { constAssertionPair } from '../../../rules/const-assertion-pair.rule.js'
import type { TypescriptOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TypescriptOptions] = [{ ...EMPTY_OPTIONS, typeSuffix: 'type' }]
const vocabulary = sourceFile('oauth', 'types', 'oauth.type.ts')
const pair = ['export const OAuthScope = {', "  OPENID: 'openid',", "  EMAIL: 'email',", '} as const'].join('\n')

ruleTester.run('const-assertion-pair', constAssertionPair, {
  valid: [
    // A constant of one word shouts the way a longer one does, and a name that shouts is a value rather than a type.
    { code: "const STYLES = { default: 'plain' } as const", filename: vocabulary, options },
    // A destructured declaration, and an alias named as a value, are not the pair this rule reads.
    { code: 'const { OAuthScope } = vocabularies', filename: vocabulary, options },
    {
      code: `${pair}\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]\n\ntype scope = string`,
      filename: vocabulary,
      options,
    },

    // A vocabulary declared without an export carries its type the same way.
    {
      code: `const OAuthScope = {\n  OPENID: 'openid',\n} as const\n\ntype OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]\n\nexport const read = (): OAuthScope => OAuthScope.OPENID`,
      filename: vocabulary,
      options,
    },

    // Every shape that is not a vocabulary: an empty object, a computed key, a value that is not a literal.
    { code: 'export const OAuthScope = {} as const', filename: vocabulary, options },
    { code: "export const OAuthScope = { [key]: 'openid' } as const", filename: vocabulary, options },
    { code: 'export const OAuthScope = { OPENID: true } as const', filename: vocabulary, options },
    { code: "export const OAuthScope = 'openid' as const", filename: vocabulary, options },
    { code: "export const OAuthScope = { OPENID: 'openid' } as Vocabulary", filename: vocabulary, options },

    {
      code: `${pair}\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]`,
      filename: vocabulary,
      options,
    },
    // An object of functions is a helper, and a record of fields is a value; neither is a vocabulary.
    {
      code: 'export const OAuthCacheKey = {\n  sessionId: (id: string) => id,\n} as const',
      filename: sourceFile('oauth', 'utils', 'oauth-cache-key.util.ts'),
      options,
    },
    { code: "export const EXAMPLE_IDS = {\n  USER: '1',\n} as const", filename: vocabulary, options },
    // With no suffix declared, where the pair is written is nobody's business; the pair itself still is.
    {
      code: `${pair}\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]`,
      filename: sourceFile('oauth', 'constants', 'oauth.constant.ts'),
      options: [EMPTY_OPTIONS],
    },
    // A value a factory produced is a vocabulary the checker reads and this rule cannot.
    {
      code: "export const OAuthProblemType = buildProblemTypes('app', { NOT_FOUND: 'not-found' })\n\nexport type OAuthProblemType = (typeof OAuthProblemType)[keyof typeof OAuthProblemType]",
      filename: vocabulary,
      options,
    },
  ],
  invalid: [
    // A vocabulary declared without an export takes its type without one either.
    {
      code: "const OAuthScope = {\n  OPENID: 'openid',\n} as const",
      filename: vocabulary,
      options,
      errors: [{ messageId: 'missingType' }],
      output:
        "const OAuthScope = {\n  OPENID: 'openid',\n} as const\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]",
    },

    // A type written as something other than the derivation leaves the vocabulary typed by nothing.
    {
      code: `${pair}\n\nexport type OAuthScope = keyof typeof OAuthScope`,
      filename: vocabulary,
      options,
      errors: [{ messageId: 'wrongDerivation' }],
      output: `${pair}\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]`,
    },

    // A derivation written under another name types nothing by the vocabulary it reads.
    {
      code: `${pair}\n\nexport type OAuthScopes = (typeof OAuthScope)[keyof typeof OAuthScope]`,
      filename: vocabulary,
      options,
      errors: [{ messageId: 'missingType' }],
      output: `${pair}\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]\n\nexport type OAuthScopes = (typeof OAuthScope)[keyof typeof OAuthScope]`,
    },

    {
      code: pair,
      filename: vocabulary,
      options,
      errors: [{ messageId: 'missingType' }],
      output: `${pair}\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]`,
    },
    {
      code: `${pair}\n\nexport type OAuthScope = 'openid' | 'email'`,
      filename: vocabulary,
      options,
      errors: [{ messageId: 'wrongDerivation' }],
      output: `${pair}\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]`,
    },
    {
      code: `${pair}\n\nexport type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]`,
      filename: sourceFile('oauth', 'constants', 'oauth.constant.ts'),
      options,
      errors: [{ messageId: 'outsideTypes' }],
    },
    {
      code: 'export type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]',
      filename: vocabulary,
      options,
      errors: [{ messageId: 'missingValue' }],
    },
  ],
})
