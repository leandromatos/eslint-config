import { createSyntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { valueCase } from '../../../rules/value-case.rule.js'
import type { NamingOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

const options: [NamingOptions] = [
  {
    ...EMPTY_OPTIONS,
    valueCases: [
      { endsWith: 'QueueName', casing: 'camelCase', deep: false },
      { endsWith: 'JobNames', casing: 'kebab-case', deep: true },
    ],
  },
]

ruleTester.run('value-case', valueCase, {
  valid: [
    // A destructured declaration and a computed property carry no name the rule could read.
    { code: 'const { mainQueueName } = config', options },
    { code: "class Queue { ['mainQueueName'] = 'MainQueue' }", options },

    // A governed name holding something other than an object of literals is read for its own value alone.
    { code: "const mainQueueName = { endSessions: 'end-sessions' }", options },
    { code: 'const mainJobNames = { ...others }', options },
    { code: 'const mainJobNames = { endSessions: 1 }', options },

    { code: "const mainQueueName = 'mainQueue'", options },
    { code: "const mainJobNames = { endSessions: 'end-sessions' }", options },
    { code: "const anythingElse = 'Not-A Name'", options },
    { code: "class Queue { mainQueueName = 'mainQueue' }", options },
    { code: "const mainQueueName = 'mainQueue' as const", options },
  ],
  invalid: [
    // A governed name holding a literal is judged by its own casing, deep or not.
    { code: "const mainJobNames = 'endSessions'", options, errors: [{ messageId: 'wrongCase' }] },

    { code: "const mainQueueName = 'main-queue'", options, errors: [{ messageId: 'wrongCase' }] },
    { code: "const mainJobNames = { endSessions: 'endSessions' }", options, errors: [{ messageId: 'wrongCase' }] },
    { code: "class Queue { mainQueueName = 'MainQueue' }", options, errors: [{ messageId: 'wrongCase' }] },
    // An assertion on the literal leaves the literal to be judged.
    { code: "const mainQueueName = 'main-queue' as const", options, errors: [{ messageId: 'wrongCase' }] },
    { code: "const mainQueueName = 'main-queue' satisfies QueueName", options, errors: [{ messageId: 'wrongCase' }] },
  ],
})
