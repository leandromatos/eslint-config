import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sourceFile, typedRuleTester } from '../../../../../__tests__/utils/index.js'
import { publicSurface } from '../../../rules/public-surface.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'public-surface')
const ruleTester = typedRuleTester(root)
const options: [TsdocOptions] = [{ commentWidth: 120, testFolder: '__tests__', frameworkSymbols: [] }]
const frameworkOptions: [TsdocOptions] = [
  { commentWidth: 120, testFolder: '__tests__', frameworkSymbols: ['generateMetadata'] },
]
const source = sourceFile('users', 'services', 'user.service.ts')
const spec = sourceFile('users', '__tests__', 'user.service.spec.ts')

ruleTester.run('public-surface', publicSurface, {
  valid: [
    // A method of an object literal is no member of a class, so no contract declares it.
    {
      code: 'export const service = {\n  /** Reads one user, or nothing when the account is closed. */\n  findOneUser() {},\n}',
      filename: source,
      options,
    },

    // A method of an object is no class member, and a class that extends an expression names no contract.
    { code: 'export const service = {\n  findOneUser() {},\n}', filename: source, options },
    {
      code: '/** Reads one user, or nothing when the account is closed. */\nclass UserService extends mixin(Base) {\n  /** Reads one user, or nothing when the account is closed. */\n  findOneUser() {}\n}',
      filename: source,
      options,
    },
    // An interface the class implements documents the method it declares.
    {
      code: 'interface Reader {\n  findOneUser(): void\n}\nclass UserService implements Reader {\n  findOneUser() {}\n}',
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

    // A method a base class declares is documented there.
    {
      code: 'class Base {\n  /** Reads whatever the subclass stores, which the contract does not name. */\n  read() {}\n}\nclass UserService extends Base {\n  override read() {}\n}',
      filename: source,
      options,
    },
    // An export that is not a function documents itself by its type.
    { code: 'export const LIMIT = 10', filename: source, options },
    // A name the framework calls is documented by the framework, and the same sentence per page says nothing.
    {
      code: 'export const generateMetadata = () => ({})',
      filename: source,
      options: frameworkOptions,
    },

    {
      code: '/** Reads one user, or nothing when the account is closed. */\nexport const findOneUser = () => 1',
      filename: source,
      options,
    },
    { code: 'const findOneUser = () => 1', filename: source, options },
    { code: 'export const findOneUser = () => 1', filename: spec, options },
    { code: 'class UserService {\n  private read() {}\n}', filename: source, options },
    {
      code: 'interface Reader {\n  read(): void\n}\nclass UserService implements Reader {\n  read() {}\n}',
      filename: source,
      options,
    },
  ],
  invalid: [
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
  ],
})
