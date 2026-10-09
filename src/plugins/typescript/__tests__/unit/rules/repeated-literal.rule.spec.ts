import { buildSourcePath, createSyntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { repeatedLiteral } from '../../../rules/repeated-literal.rule.js'
import type { RepeatedLiteralOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()

const constant = buildSourcePath('users', 'constants', 'users.constant.ts')

ruleTester.run('repeated-literal', repeatedLiteral, {
  valid: [
    // A string written fewer times than the threshold, and one the project ignores, are left alone.
    {
      code: "export const A = ['app']\nexport const B = ['app']\nexport const C = ['json', 'json', 'json']",
      filename: constant,
      options: [{ threshold: 3, ignoreStrings: 'json, svg' } satisfies RepeatedLiteralOptions],
    },
    // A word written once, and an empty string, which holds nothing to name.
    { code: "export const A = ['app', 'assets']\nexport const B = ['', '']", filename: constant },
    // A string that names something rather than holding a value: a module, a key, a type, a directive.
    {
      code: "'use strict'\nimport { a } from './a.js'\nexport { b } from './a.js'\nexport * from './a.js'\nconst load = () => import('./a.js')\nexport type Kind = 'a' | 'a'\nexport const A = { 'a': 1 }\nexport class B {\n  'a' = 1\n}\nexport enum C {\n  'a' = 1,\n}",
      filename: constant,
    },
    // A table keyed by name may hold a row a call builds, and its columns still repeat freely.
    {
      code: "export const TOKENS = { card: { kind: 'ground' }, field: { kind: 'ground' }, 'card-hover': hover(2) }",
      filename: constant,
    },
    // What repeats down a column of a table, a list of rows or a map of them, is the shape of the table.
    {
      code: "export const ASSETS = [{ kind: 'svg', fills: ['#FFF'] }, { kind: 'svg', fills: ['#FFF'] }]\nexport const CONTROLS = { a: { kind: 'number', when: [{ is: 'on' }] } as const, b: { kind: 'number', when: [{ is: 'on' }] } }",
      filename: constant,
    },
  ],
  invalid: [
    // An object handed to a call, or a map with a field that is no object, is not a table.
    {
      code: "export const A = build({ kind: 'svg' }, { kind: 'svg' })\nexport const B = { hero: HERO, front: { side: 'front' }, back: { side: 'front' } }",
      filename: constant,
      errors: [
        { messageId: 'repeatedLiteral', data: { value: 'svg', count: '2' } },
        { messageId: 'repeatedLiteral', data: { value: 'front', count: '2' } },
      ],
    },
    {
      code: "export const A = ['app', 'assets']\nexport const B = ['app']\nexport const C = { router: 'app' }",
      filename: constant,
      errors: [
        { messageId: 'repeatedLiteral', data: { value: 'app', count: '3' }, line: 2 },
        { messageId: 'repeatedLiteral', data: { value: 'app', count: '3' }, line: 3 },
      ],
    },
  ],
})
