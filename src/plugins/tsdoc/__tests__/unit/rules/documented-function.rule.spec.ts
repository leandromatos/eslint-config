import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { packageSourceFile, sourceFile, typedRuleTester } from '../../../../../__tests__/utils/index.js'
import { documentedFunction } from '../../../rules/documented-function.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'documented-function')
const ruleTester = typedRuleTester(root)
const options: [TsdocOptions] = [{ commentWidth: 120, readsReleaseTags: false }]
const source = sourceFile('users', 'services', 'user.service.ts')
const spec = sourceFile('users', '__tests__', 'user.service.spec.ts')

ruleTester.run('documented-function', documentedFunction, {
  valid: [
    // An overload the module keeps to itself reads the same way.
    {
      code: '/** Answers the value it was handed, untouched. */\nfunction pick(value: string): string\nfunction pick(value: string): string {\n  return value\n}',
      filename: source,
      options,
    },
    // The caller reads the overload it calls, so each signature is documented and the implementation is not.
    {
      code: '/**\n * Reads one attribute.\n *\n * @param name - The attribute.\n * @returns The value.\n */\nexport function attribute(name: string): string\n/**\n * Reads one attribute, or its fallback.\n *\n * @param name - The attribute.\n * @param fallback - What answers when the attribute is missing.\n * @returns The value.\n */\nexport function attribute(name: string, fallback: string): string\nexport function attribute(name: string, fallback?: string): string {\n  return fallback ?? name\n}',
      filename: source,
      options,
    },
    {
      code: 'class Span {\n  /**\n   * Reads one attribute.\n   *\n   * @param name - The attribute.\n   * @returns The value.\n   */\n  attribute(name: string): string\n\n  attribute(name: string): string {\n    return name\n  }\n}',
      filename: source,
      options,
    },
    // A method of an object literal is no member of a class, so no contract declares it.
    {
      code: 'export const service = {\n  /** Reads one user, or nothing when the account is closed. */\n  findOneUser() {},\n}',
      filename: source,
      options,
    },

    // A constructor and an accessor are not methods, which is what this rule reads in a class.
    {
      code: 'export class UserService {\n  constructor() {}\n\n  get limit() {\n    return 1\n  }\n}',
      filename: source,
      options,
    },
    // A method of an object is no class member.
    { code: 'export const service = {\n  findOneUser() {},\n}', filename: source, options },
    {
      code: '/** Reads one user, or nothing when the account is closed. */\nclass UserService extends mixin(Base) {\n  /** Reads one user, or nothing when the account is closed. */\n  findOneUser() {}\n}',
      filename: source,
      options,
    },

    // A declaration the export does not name a function of is not part of the surface this rule reads.
    { code: 'export type UserId = string', filename: source, options },
    { code: 'export const [first] = [1]', filename: source, options },
    // A method of a class expression is judged the same way, and one of an object is not a method at all.
    {
      code: '/** Reads one user, or nothing when the account is closed. */\nexport const service = class {\n  /** Reads one user, or nothing when the account is closed. */\n  findOneUser() {}\n}',
      filename: source,
      options,
    },
    // A summary that runs to no sentence end is read whole.
    { code: '/** Reads one user or nothing */\nexport const findOneUser = () => 1', filename: source, options },

    // A method a contract declares takes the contract's text through the inline tag.
    {
      code: 'interface Reader {\n  /** Reads one user, or nothing when the account is closed. */\n  findOneUser(): void\n}\nclass UserService implements Reader {\n  /** {@inheritDoc Reader.findOneUser} */\n  findOneUser() {}\n}',
      filename: source,
      options,
    },
    // An export that is not a function documents itself by its type.
    { code: 'export const LIMIT = 10', filename: source, options },

    {
      code: '/** Reads one user, or nothing when the account is closed. */\nexport const findOneUser = () => 1',
      filename: source,
      options,
    },
    {
      code: '/** Reads one user, or nothing when the account is closed. */\nconst findOneUser = () => 1',
      filename: source,
      options,
    },
    {
      code: 'class UserService {\n  /** Reads the row the cache missed, signed with the key of the account. */\n  private read() {}\n}',
      filename: source,
      options,
    },
    // A function written inline as an argument is no declaration of the module.
    { code: '/** Lists the users. */\nexport const users = [1, 2].map(user => user * 2)', filename: source, options },
  ],
  invalid: [
    // A method under a computed key names no overload, so a signature before it does not stand for it.
    {
      code: 'class Span {\n  /** Reads one. */\n  [one](): void\n\n  [two]() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    {
      code: "class Span {\n  /** Reads one. */\n  'read'(): void\n\n  'read'() {}\n}",
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    {
      code: 'export default function (value: string): string',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'default' } }],
    },
    // A signature of an overload is what the caller reads, so it carries a comment like any function.
    {
      code: 'export function attribute(name: string): string\nexport function attribute(name: string, fallback?: string): string {\n  return fallback ?? name\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'attribute' } }],
    },
    // A method a contract declares is documented like any other: an interface, a base class, an abstract one.
    {
      code: 'interface Reader {\n  read(): void\n}\nclass UserService implements Reader {\n  read() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'read' } }],
    },
    {
      code: 'class Base {\n  /** Reads whatever the subclass stores, which the contract does not name. */\n  read() {}\n}\nclass UserService extends Base {\n  override read() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'read' } }],
    },
    {
      code: 'abstract class Base {\n  /** Reads whatever the subclass stores, which the contract does not name. */\n  protected abstract read(): void\n}\nclass UserService extends Base {\n  protected read() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'read' } }],
    },
    // A spec and a name a framework calls are documented like any other.
    { code: 'export const findOneUser = () => 1', filename: spec, options, errors: [{ messageId: 'undocumented' }] },
    {
      code: 'export const generateMetadata = () => ({})',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    // A method under a computed key is public too, and carries no name for the message.
    {
      code: 'class UserService {\n  [key]() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },

    // An exported function declaration is part of the surface too.
    {
      code: 'export function findOneUser() {\n  return 1\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },

    { code: 'export const findOneUser = () => 1', filename: source, options, errors: [{ messageId: 'undocumented' }] },
    {
      code: '/** Finds one user. */\nexport const findOneUser = () => 1',
      filename: source,
      options,
      errors: [{ messageId: 'restatesName' }],
    },
    {
      code: 'class UserService {\n  findOneUser() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    // The visibility decides nothing: a private or protected method is read by whoever edits the class.
    {
      code: 'class UserService {\n  private read() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    {
      code: 'class UserService {\n  protected read() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    // Extending a class covers only what the class declares.
    {
      code: 'class Base {\n  /** Reads whatever the subclass stores, which the contract does not name. */\n  read() {}\n}\nclass UserService extends Base {\n  write() {}\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    // A function the module keeps to itself is documented like one it exports.
    { code: 'const findOneUser = () => 1', filename: source, options, errors: [{ messageId: 'undocumented' }] },
    // A default export is a declared function too, whichever way it is written.
    {
      code: 'export default function Page() {\n  return 1\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    {
      code: 'export default function () {\n  return 1\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'default' } }],
    },
    { code: 'export default () => 1', filename: source, options, errors: [{ messageId: 'undocumented' }] },
    {
      code: 'const Page = () => 1\nexport default Page',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    {
      code: 'function findOneUser() {\n  return 1\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    {
      code: '/** Finds one user. */\nconst findOneUser = () => 1',
      filename: source,
      options,
      errors: [{ messageId: 'restatesName' }],
    },
  ],
})

ruleTester.run('documented-function, in a repository of several packages', documentedFunction, {
  valid: [],
  invalid: [
    // A declaration is documented wherever it sits, so a file with no `src` in its path is judged too.
    {
      code: 'export const findOneUser = () => 1',
      filename: 'find-one-user.ts',
      options,
      errors: [{ messageId: 'undocumented' }],
    },
    {
      code: 'export const findOneUser = () => 1',
      filename: packageSourceFile('apps/x', 'users', 'services', 'user.service.ts'),
      options,
      errors: [{ messageId: 'undocumented' }],
    },
  ],
})
