import { buildSourcePath, createSyntaxRuleTester } from '../../../../../__tests__/utils/index.js'
import { composedConstant } from '../../../rules/composed-constant.rule.js'

const ruleTester = createSyntaxRuleTester()

const constant = buildSourcePath('users', 'constants', 'users.constant.ts')

ruleTester.run('composed-constant', composedConstant, {
  valid: [
    // Literals alone are a constant themselves.
    { code: "export const HTTP_TEST = { kind: 'e2e', clients: ['supertest'] }", filename: constant },
    { code: "export const KINDS = ['unit', 'e2e']", filename: constant },
    // A composition reads every field by name: a constant, a member, a call, a template that reads one, a group.
    {
      code: 'export const TIER = { roots: ROOTS, kind: KIND.e2e, folders: Object.values(FOLDER), glob: `${ROOT}/**`, groups: { naming: NAMING } } satisfies Tier',
      filename: constant,
    },
    // A switch, an empty string and an empty list or map hold nothing to name.
    {
      code: "export const EMPTY = { alias: ALIAS, deep: false, folder: '', roots: [], map: {} }",
      filename: constant,
    },
    // A sentence is text the reader reads whole, never a value to extend.
    {
      code: "export const PROBLEM = { type: TYPE.NOT_FOUND, title: 'Policy not found.', detail: `Read the policy again.` }",
      filename: constant,
    },
    // A default extended by a spread takes its items in place.
    { code: "export const FOLDERS = [...DEFAULT_FOLDERS, 'migrations']", filename: constant },
    {
      code: "export const PARTICIPLES = { ...DEFAULT_PARTICIPLES, createMock: 'mocked' }",
      filename: constant,
    },
    // A row of a table holds its own fields, whatever its neighbours read.
    {
      code: "export const CASES = [{ endsWith: SUFFIX.queue, casing: 'camelCase' }, ...OTHER_CASES]",
      filename: constant,
    },
    // A field built by a call is a row too, so a table may mix the two.
    {
      code: "export const TOKENS = { background: { kind: 'ground', value: neutral(1) }, 'card-hover': hover('neutral', 2), ...family('primary') }",
      filename: constant,
    },
    // A map whose every field is an object is a table keyed by name, and each field a row.
    {
      code: "export const CONTROLS = { tint: { kind: 'color', defaultValue: VIOLET }, swirl: { kind: 'number', min: 0 } as const, ...STUDIO_CONTROLS } satisfies Schema",
      filename: constant,
    },
    // A value that is no object nor list, and a declaration inside a function, are not what the rule reads.
    {
      code: "export const SIZE = 15\nconst read = () => {\n  const TIER = { roots: ROOTS, kind: 'e2e' }\n}",
      filename: constant,
    },
    { code: 'const { roots } = TIER', filename: constant },
    // A declaration that holds nothing, and a hole in a list, hold nothing to name.
    { code: 'export let TIER', filename: constant },
    { code: 'export const ROOTS = [ROUTER, , ALIAS]', filename: constant },
  ],
  invalid: [
    // A composition that writes a value in place mixes two ways of saying one.
    {
      code: "export const TTL = { access: SHORT, code: ms('10m') / 1000, refresh: '7d' }",
      filename: constant,
      errors: [
        { messageId: 'valueInPlace', data: { field: 'code' } },
        { messageId: 'valueInPlace', data: { field: 'refresh' } },
      ],
    },
    {
      code: "export const ROOTS = [ROUTER, 'components']",
      filename: constant,
      errors: [{ messageId: 'valueInPlace', data: { field: '[1]' } }],
    },
    // An extension still writes no list or map in place, and a group is judged as the object around it.
    {
      code: "export const TIER = { ...DEFAULT_TIER, roots: ['app'], groups: { naming: NAMING, roles: ['result'] }, 'kinds': [KIND], [key]: ['a'] } as const",
      filename: constant,
      errors: [
        { messageId: 'valueInPlace', data: { field: 'roots' } },
        { messageId: 'valueInPlace', data: { field: 'roles' } },
        { messageId: 'valueInPlace', data: { field: '[computed]' } },
      ],
    },
    // A map with a field that is no object is not a table, so an object beside a constant is written in place.
    {
      code: 'export const VIEWS = { hero: HERO, front: { azimuth: 0 } }',
      filename: constant,
      errors: [{ messageId: 'valueInPlace', data: { field: 'front' } }],
    },
    // A word in a template that reads nothing is still a word written in place.
    {
      code: 'export const TTL = { access: SHORT, refresh: `7d` }',
      filename: constant,
      errors: [{ messageId: 'valueInPlace', data: { field: 'refresh' } }],
    },
    // A spread of something written in place extends nothing.
    {
      code: "export const ROOTS = [ROUTER, ...['app']]",
      filename: constant,
      errors: [{ messageId: 'valueInPlace', data: { field: '[1]' } }],
    },
  ],
})
