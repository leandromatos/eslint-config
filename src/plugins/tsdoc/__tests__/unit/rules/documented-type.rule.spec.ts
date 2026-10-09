import {
  buildPackageSourcePath,
  buildSourcePath,
  createSyntaxRuleTester,
} from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { documentedType } from '../../../rules/documented-type.rule.js'
import type { TsdocOptions } from '../../../types/index.js'

const ruleTester = createSyntaxRuleTester()
const options: [TsdocOptions] = [{ ...EMPTY_OPTIONS, commentWidth: 120 }]
const source = buildSourcePath('users', 'types', 'users.type.ts')
const spec = buildSourcePath('users', '__tests__', 'unit', 'users.spec.ts')

ruleTester.run('documented-type', documentedType, {
  valid: [
    // A class, an interface and an alias with a comment that says what the name cannot.
    {
      code: '/** The person signed in, as every guard reads them. */\nexport class UserEntity {}',
      filename: source,
      options,
    },
    {
      code: '/** What a page of users is cut by, newest first. */\ninterface UserCriteria {\n  limit: number\n}',
      filename: source,
      options,
    },
    {
      code: '/** The ID a route carries, never the email. */\nexport type UserKey = string',
      filename: source,
      options,
    },
    // A derived alias carries one too.
    {
      code: '/** One of the roles a person may hold. */\nexport type UserRole = (typeof UserRole)[keyof typeof UserRole]',
      filename: source,
      options,
    },
    // A decorated class carries the comment above its decorators.
    {
      code: '/** Reads the users, behind the cache. */\n@Injectable()\nexport class UserService {}',
      filename: source,
      options,
    },
    {
      code: '/** Reads the users, behind the cache. */\nexport @Injectable() class UserService {}',
      filename: source,
      options,
    },
    // A class bound to a variable, and a type inside a module declaration.
    { code: '/** The service a test swaps in. */\nexport const Service = class {}', filename: source, options },
    {
      code: "declare module 'express' {\n  /** The request, with the person the guard resolved. */\n  interface Request {\n    user: string\n  }\n}",
      filename: source,
      options,
    },
    // A class inside an array is a value, not a declaration.
    { code: 'const [Service] = [class {}]', filename: source, options },
    // A default export with no name answers to `default`.
    { code: '/** The page every route falls back to. */\nexport default class {}', filename: source, options },
  ],
  invalid: [
    // A spec and a name a framework reads are documented like any other.
    {
      code: 'export class UserFixture {}',
      filename: spec,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'UserFixture' } }],
    },
    {
      code: 'export type Props = { id: string }',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'Props' } }],
    },
    {
      code: 'export class UserEntity {}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'UserEntity' } }],
    },
    {
      code: 'interface UserCriteria {\n  limit: number\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'UserCriteria' } }],
    },
    // An alias a type utility derives is documented like any other.
    {
      code: 'export type UserRole = (typeof UserRole)[keyof typeof UserRole]',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'UserRole' } }],
    },
    {
      code: 'export type TokenInsertAttributes = InferInsertModel<typeof TokensTable>',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'TokenInsertAttributes' } }],
    },
    {
      code: 'type Limit = typeof LIMIT',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'Limit' } }],
    },
    // A comment a blank line away, or a note, documents nothing.
    {
      code: '/** The person signed in, as every guard reads them. */\n\nexport class UserEntity {}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'UserEntity' } }],
    },
    {
      code: '// The person signed in.\nexport class UserEntity {}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'UserEntity' } }],
    },
    {
      code: 'export const Service = class {}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'Service' } }],
    },
    {
      code: 'export default class {}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'default' } }],
    },
    {
      code: 'declare global {\n  interface ProcessEnv {\n    PORT: string\n  }\n}',
      filename: source,
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'ProcessEnv' } }],
    },
    // A summary that only rewrites the name.
    {
      code: '/** The user entity. */\nexport class UserEntity {}',
      filename: source,
      options,
      errors: [{ messageId: 'restatesName', data: { name: 'UserEntity' } }],
    },
  ],
})

ruleTester.run('documented-type, in a repository of several packages', documentedType, {
  valid: [],
  invalid: [
    // A declaration is documented wherever it sits, so a file with no `src` in its path is judged too.
    {
      code: 'export class UserFixture {}',
      filename: 'modules/dpop-key/index.ts',
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'UserFixture' } }],
    },
    {
      code: 'export class UserFixture {}',
      filename: buildPackageSourcePath('libs/x', 'users', 'types', 'users.type.ts'),
      options,
      errors: [{ messageId: 'undocumented', data: { name: 'UserFixture' } }],
    },
  ],
})
