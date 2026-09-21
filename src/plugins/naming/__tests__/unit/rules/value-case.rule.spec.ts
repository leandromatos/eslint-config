import { syntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { valueCase } from '../../../rules/value-case.rule.js'
import type { NamingOptions } from '../../../types/index.js'

const ruleTester = syntaxRuleTester()

const options: [NamingOptions] = [
  {
    ...EMPTY_OPTIONS,
    valueCases: [
      { endsWith: 'QueueName', casing: 'kebab-case', deep: false },
      { endsWith: 'JobNames', casing: 'camelCase', deep: true },
    ],
  },
]

ruleTester.run('value-case', valueCase, {
  valid: [
    // A destructured declaration and a computed property carry no name the rule could read.
    { code: 'const { mainQueueName } = config', options },
    { code: "class Queue { ['mainQueueName'] = 'MainQueue' }", options },

    // A governed name holding something other than an object of literals is read for its own value alone.
    { code: "const mainQueueName = { endSessions: 'endSessions' }", options },
    { code: 'const mainJobNames = { ...others }', options },
    { code: 'const mainJobNames = { endSessions: 1 }', options },

    { code: "const mainQueueName = 'main-queue'", options },
    { code: "const mainJobNames = { endSessions: 'endSessions' }", options },
    { code: "const anythingElse = 'Not-A Name'", options },
    { code: "class Queue { mainQueueName = 'main-queue' }", options },
    { code: "const mainQueueName = 'main-queue' as const", options },
  ],
  invalid: [
    // A governed name holding a literal is judged by its own casing, deep or not.
    { code: "const mainJobNames = 'end-sessions'", options, errors: [{ messageId: 'wrongCase' }] },

    { code: "const mainQueueName = 'mainQueue'", options, errors: [{ messageId: 'wrongCase' }] },
    { code: "const mainJobNames = { endSessions: 'end-sessions' }", options, errors: [{ messageId: 'wrongCase' }] },
    { code: "class Queue { mainQueueName = 'MainQueue' }", options, errors: [{ messageId: 'wrongCase' }] },
  ],
})
