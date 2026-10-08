import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { stringPattern } from '../../../rules/string-pattern.rule.js'
import type { TextOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [TextOptions] = [
  {
    stringPatterns: [
      {
        callee: 'this.logger.warn',
        mustNot: '\\.$',
        because: 'a log line reads as a line, not as a sentence',
      },
      {
        callee: 'new NotFoundException',
        property: 'title',
        must: '\\.$',
        because: 'an exception title is a sentence the reader is shown',
      },
      {
        callee: 'ApiProperty',
        property: 'description',
        target: '^id$',
        must: '^The unique identifier',
        because: 'an identifier is described the same way everywhere',
      },
    ],
  },
]

ruleTester.run('string-pattern', stringPattern, {
  valid: [
    // A decorated declaration under a computed key names nothing the pattern could target.
    { code: "class Dto { @ApiProperty({ description: 'The ID.' }) ['id']: string }", options },

    // A decorator on something that is not a named declaration targets nothing.
    { code: "class Dto { @ApiProperty({ description: 'The ID of the user.' }) [key]: string }", options },
    { code: "@ApiProperty({ description: 'The ID of the user.' })\nclass Dto {}", options },
    // A template literal with no expression is read as the text it carries.
    { code: 'this.logger.warn(`The token expired`)', options },

    // Every shape that carries no string the pattern could judge.
    { code: 'this.logger.warn()', options },
    { code: 'this.logger.warn(message)', options },
    { code: "new NotFoundException('User not found.')", options },
    { code: 'new NotFoundException({ code: 404 })', options },
    { code: 'new NotFoundException({ title })', options },
    { code: "class Dto { @ApiProperty({ description: 'The name of the user.' }) [key]: string }", options },
    { code: "const doc = ApiProperty({ description: 'The name of the user.' })", options },

    { code: "this.logger.warn('The token expired')", options },
    { code: "new NotFoundException({ title: 'User not found.' })", options },
    { code: "somebodyElse.warn('Anything at all.')", options },
    { code: "class Dto { @ApiProperty({ description: 'The name of the user.' }) name: string }", options },
    { code: "class Dto { @ApiProperty({ description: 'The unique identifier of the user.' }) id: string }", options },
  ],
  invalid: [
    { code: "this.logger.warn('The token expired.')", options, errors: [{ messageId: 'mustNotMatch' }] },
    { code: "new NotFoundException({ title: 'User not found' })", options, errors: [{ messageId: 'mustMatch' }] },
    {
      code: 'this.logger.warn(`The token ${id} expired.`)',
      options,
      errors: [{ messageId: 'mustNotMatch' }],
    },
    {
      code: "class Dto { @ApiProperty({ description: 'The ID of the user.' }) id: string }",
      options,
      errors: [{ messageId: 'mustMatch' }],
    },
  ],
})
