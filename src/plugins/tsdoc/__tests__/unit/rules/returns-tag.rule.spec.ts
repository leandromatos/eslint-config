import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sourceFile, typedRuleTester } from '../../../../../__tests__/utils/index.js'
import { returnsTag } from '../../../rules/returns-tag.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'returns-tag')
const ruleTester = typedRuleTester(root)
const filename = sourceFile('users', 'services', 'user.service.ts')

const options: [TsdocOptions] = [{ commentWidth: 120, readsReleaseTags: false }]

ruleTester.run('returns-tag', returnsTag, {
  valid: withFilename([
    // A value comes back and the comment says what it is.
    { code: '/**\n * Counts the users.\n *\n * @returns How many there are.\n */\nconst count = () => 1', options },
    // Nothing comes back and the comment says nothing about it.
    { code: '/** Logs the users. */\nfunction log() {\n  write()\n}', options },
    { code: '/** Logs the users. */\nfunction log(isQuiet) {\n  if (isQuiet) return\n  write()\n}', options },
    // A return inside a function of its own belongs to that function.
    { code: '/** Logs the users. */\nfunction log() {\n  const read = () => {\n    return 1\n  }\n}', options },
    // A function nothing documents is left alone.
    { code: 'const count = () => 1', options },

    // A constructor builds the instance.
    {
      code: 'class Service {\n  /**\n   * Builds it.\n   *\n   * @returns Nothing.\n   */\n  constructor() {}\n}',
      options,
    },
    { code: 'class Service {\n  /** Builds it. */\n  constructor() {\n    return build()\n  }\n}', options },
    // A comment that inherits its documentation documents nothing here.
    { code: '/**\n * @inheritDoc\n */\nfunction count() {\n  return 1\n}', options },
    // A declared function that hands back nothing, by its type.
    { code: '/** Logs. */\ndeclare function log(): void', options },
    { code: '/** Logs. */\ndeclare function log(): undefined', options },
    { code: '/** Fails. */\ndeclare function fail(): never', options },
    // A method without a body, an interface method and a property typed as a function say what comes back.
    {
      code: 'abstract class Repository {\n  /**\n   * Counts.\n   *\n   * @returns How many.\n   */\n  abstract count(): number\n}',
      options,
    },
    { code: 'interface Options {\n  /** Logs. */\n  log: () => void\n}', options },
    { code: 'interface Options {\n  /** The limit. */\n  limit: number\n}', options },
    // A promise built in place that resolves with nothing hands back no value to document.
    { code: '/** Waits. */\nfunction wait() {\n  return new Promise(resolve => resolve())\n}', options },
    {
      code: '/** Waits. */\nfunction wait() {\n  return new Promise<void>(function (resolve) {\n    later(() => resolve())\n  })\n}',
      options,
    },
    { code: '/** Waits. */\nfunction wait() {\n  return new Promise(executor)\n}', options },
    { code: '/** Waits. */\nfunction wait() {\n  return new Promise(() => {})\n}', options },
    { code: '/** Waits. */\nfunction wait() {\n  return new Promise(({ resolve }) => resolve())\n}', options },

    // Two tags on a constructor, which nothing asks.
    {
      code: 'class Service {\n  /**\n   * Builds it.\n   *\n   * @returns One.\n   * @returns Two.\n   */\n  constructor() {}\n}',
      options,
    },

    // A generator hands back what it yields, and a tag says what that is.
    { code: '/**\n * Lists the users.\n *\n * @returns The IDs.\n */\nfunction* list() {\n  yield 1\n}', options },
    {
      code: '/**\n * Lists the users.\n *\n * @returns The IDs.\n */\nfunction* list() {\n  yield* [1, 2]\n}',
      options,
    },
    {
      code: '/**\n * Lists the users.\n *\n * @returns The IDs.\n */\nasync function* list() {\n  const inner = function* () {}\n  return 1\n}',
      options,
    },
    // The type decides when it says nothing comes back, whatever the body looks like.
    { code: 'declare function write(): void\n/** Logs. */\nconst log = () => write()', options },
    { code: '/** Reads. */\nfunction read() {\n  return undefined\n}', options },
    { code: '/** Saves. */\ndeclare function save(): Promise<void>', options },
    { code: '/** Saves. */\nasync function save(): Promise<undefined | void> {}', options },
    // A bare hyphen still reads as text.
    { code: '/**\n * Counts.\n *\n * @returns -\n */\nfunction count() {\n  return 1\n}', options },
  ]),
  invalid: withFilename([
    // A value comes back and no tag says so, however the body hands it back.
    { code: '/** Counts. */\nconst count = () => 1', options, errors: [{ messageId: 'missingReturns' }] },
    { code: '/** Logs. */\nconst log = () => write()', options, errors: [{ messageId: 'missingReturns' }] },
    {
      code: '/** Counts. */\nfunction count(items) {\n  for (const item of items) {\n    if (item) return item\n  }\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: '/** Counts. */\nfunction count() {\n  try {\n    return 1\n  } catch {\n    return 2\n  }\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: '/** Counts. */\nasync function count() {\n  return await read()\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: 'class Repository {\n  /** Counts. */\n  get count() {\n    return 1\n  }\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    // A promise built in place that resolves with a value, or hands its resolver on, does.
    {
      code: '/** Reads. */\nfunction read() {\n  return new Promise(resolve => later(() => resolve(1)))\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: '/** Reads. */\nfunction read() {\n  return new Promise(resolve => later(resolve))\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: '/** Reads. */\nfunction read() {\n  return new Map()\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: '/** Reads. */\nfunction read() {\n  return new Readers.Promise(resolve => resolve())\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    // A declared function hands back what its type names, and one with no type hands back anything.
    { code: '/** Counts. */\ndeclare function count(): number', options, errors: [{ messageId: 'missingReturns' }] },
    { code: '/** Logs. */\ndeclare function log()', options, errors: [{ messageId: 'missingReturns' }] },
    // A generator that yields a value.
    {
      code: '/** Lists the users. */\nfunction* list() {\n  yield 1\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    /*
     * Every function is asked: an interface method, a method without a body, an overload, a component and a property
     * typed as a function.
     */
    {
      code: 'interface Repository {\n  /** Counts. */\n  count(): number\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: 'abstract class Repository {\n  /** Counts. */\n  abstract count(): number\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: 'class Repository {\n  /** Counts. */\n  count(): number\n  count() {\n    return 1\n  }\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: '/** Renders the card. */\nfunction Card() {\n  return markup\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: 'interface Options {\n  /** Builds it. */\n  build: () => number\n}',
      options,
      errors: [{ messageId: 'missingReturns' }],
    },
    {
      code: 'interface Options {\n  /**\n   * Logs.\n   *\n   * @returns Nothing.\n   */\n  log: () => void\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    // A tag on a function that hands nothing back, whatever its declared type.
    {
      code: '/**\n * Logs.\n *\n * @returns Nothing.\n */\nfunction log() {\n  write()\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    {
      code: '/**\n * Fails.\n *\n * @returns Never.\n */\nfunction fail(): number {\n  throw new Error()\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    {
      code: 'class Repository {\n  /**\n   * Sets the limit.\n   *\n   * @returns Nothing.\n   */\n  set limit(value: number) {}\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    {
      code: '/**\n * Logs.\n *\n * @returns Nothing.\n */\ndeclare function log(): void',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    // A tag on a function whose type says nothing comes back, async or not.
    {
      code: '/**\n * Saves the users.\n *\n * @returns Nothing.\n */\nasync function save() {\n  await write()\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    {
      code: '/**\n * Saves.\n *\n * @returns Nothing.\n */\nconst save = async (): Promise<void> => write()',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    {
      code: 'declare function write(): void\n/**\n * Logs.\n *\n * @returns Nothing.\n */\nconst log = () => write()',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    {
      code: '/**\n * Fails.\n *\n * @returns Nothing.\n */\nfunction fail(): never {\n  throw new Error()\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    {
      code: 'interface Repository {\n  /**\n   * Logs.\n   *\n   * @returns Nothing.\n   */\n  log(): void\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    // A generator that yields nothing, and a promise built in place that resolves empty.
    {
      code: '/**\n * Lists.\n *\n * @returns Nothing.\n */\nfunction* list() {\n  yield\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    {
      code: '/**\n * Waits.\n *\n * @returns The promise.\n */\nfunction wait() {\n  return new Promise(resolve => resolve())\n}',
      options,
      errors: [{ messageId: 'unexpectedReturns' }],
    },
    // Two tags are one too many, async or not, on an interface method too.
    {
      code: 'interface Repository {\n  /**\n   * Counts.\n   *\n   * @returns One.\n   * @returns Two.\n   */\n  count(): number\n}',
      options,
      errors: [{ messageId: 'duplicateReturns' }],
    },
    {
      code: '/**\n * Counts.\n *\n * @returns One.\n * @returns Two.\n */\nfunction count() {\n  return 1\n}',
      options,
      errors: [{ messageId: 'duplicateReturns' }],
    },
    {
      code: '/**\n * Saves.\n *\n * @returns One.\n * @returns Two.\n */\nasync function save() {}',
      options,
      errors: [{ messageId: 'duplicateReturns' }],
    },
    // A tag with no text.
    {
      code: '/**\n * Counts.\n *\n * @returns\n */\nfunction count() {\n  return 1\n}',
      options,
      errors: [{ messageId: 'missingReturnsDescription' }],
    },
  ]),
})

/**
 * The cases, each placed in a source file of the fixture project, so the parser reads their types.
 *
 * @param cases - The cases as written.
 * @returns The cases, with the file they are read from.
 */
function withFilename<Case extends object>(cases: Case[]): (Case & { filename: string })[] {
  return cases.map(testCase => ({ ...testCase, filename }))
}
