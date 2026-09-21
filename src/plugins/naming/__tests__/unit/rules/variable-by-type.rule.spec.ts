import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { sourceFile, typedRuleTester } from '../../../../../__tests__/utils/index.js'
import { EMPTY_OPTIONS } from '../../../constants/index.js'
import { variableByType } from '../../../rules/variable-by-type.rule.js'
import type { NamingOptions } from '../../../types/index.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'variable-by-type')
const ruleTester = typedRuleTester(root)
const options: [NamingOptions] = [
  {
    ...EMPTY_OPTIONS,
    genericNames: { DeepMocked: '', Paginated: 'paginated' },
    shapelessTypes: [],
    roleNames: ['result', 'expected'],
    verbParticiples: { create: 'created' },
    testFolder: '__tests__',
  },
]
const source = sourceFile('users', 'services', 'user.service.ts')
const spec = sourceFile('users', '__tests__', 'user.service.spec.ts')
const declaration = 'interface UserEntity { id: string }\ndeclare function findUser(): UserEntity\n'
const declarations = [
  'interface UserEntity { id: string }',
  'interface ActivityStatus { name: string }',
  'declare namespace domain {',
  '  interface Session { id: string }',
  '}',
  'declare function findStatus(): ActivityStatus',
  'declare function findSession(): domain.Session',
  'declare function findPages(): Paginated<UserEntity>[]',
  'interface Box<TItem> { item: TItem }',
  'declare function findBox(): Box<UserEntity>',
  'declare function findStrings(): Paginated<string>',
  'interface Paginated<TItem> { items: TItem[] }',
  'type UserId = string | number',
  'type Reader<TValue> = { read: () => TValue }',
  'declare function findUser(): UserEntity',
  'declare function findUsers(): UserEntity[]',
  'declare function findPage(): Paginated<UserEntity>',
  'declare function findId(): UserId',
  'declare function findReader(): Reader<UserEntity>',
  '',
].join('\n')

ruleTester.run('variable-by-type', variableByType, {
  valid: [
    { code: `${declaration}const userEntity = findUser()`, filename: source, options },
    { code: `${declaration}const createdUserEntity = findUser()`, filename: source, options },
    { code: `${declaration}export const anything = findUser()`, filename: source, options },
    { code: 'const count = 1', filename: source, options },
    { code: `${declaration}const result = findUser()`, filename: spec, options },
    { code: `${declaration}const expectedUserEntity = findUser()`, filename: spec, options },
    { code: 'const identity = <TValue,>(value: TValue): TValue => value', filename: source, options },
    // A list of a type ends with the plural of its name.
    { code: `${declarations}const userEntities = findUsers()`, filename: source, options },
    // A wrapper the options name puts its word before the argument's name.
    { code: `${declarations}const paginatedUserEntity = findPage()`, filename: source, options },
    // A union names nothing the value could be called after.
    { code: `${declarations}const anything = findId()`, filename: source, options },
    // An alias instantiated with an argument is not the name of what the value holds.
    { code: `${declarations}const anything = findReader()`, filename: source, options },
    // A name that leaves as a shorthand property is fixed by the key, which is the reader's contract.
    {
      code: `${declarations}const read = () => {\n  const entity = findUser()\n\n  return { entity }\n}`,
      filename: source,
      options,
    },
    // A name whose words are all the type's own keeps none of them as a prefix.
    { code: `${declarations}const activityStatuses = [findStatus()]`, filename: source, options },
    // An annotation written as a qualified name is read by the checker rather than by what the author wrote.
    { code: `${declarations}const session: domain.Session = findSession()`, filename: source, options },
    // A generic the options do not name, instantiated, is not a name the value could carry.
    { code: `${declarations}const anything = findBox()`, filename: source, options },
    // A wrapper whose argument has no name of its own names nothing either.
    { code: `${declarations}const anything = findStrings()`, filename: source, options },
    // A parameter destructured behind a default declares no name either.
    { code: `${declarations}const read = ({ id }: UserEntity = findUser()) => id`, filename: source, options },
    // A comment that documents another parameter is left as it stands.
    {
      code: `${declarations}/**\n * Reads one user.\n *\n * @param other - Something else.\n */\nconst read = (userEntity: UserEntity, other: string) => other`,
      filename: source,
      options,
    },
    // A prefix is justified by a value of the type in the function above, which the walk reaches from the block.
    {
      code: `${declarations}const read = () => {\n  const userEntity = findUser()\n  if (userEntity) {\n    const existingUserEntity = findUser()\n\n    return existingUserEntity\n  }\n\n  return userEntity\n}`,
      filename: source,
      options,
    },
    // A destructured parameter declares no name the rule could judge.
    { code: `${declarations}const read = ({ id }: UserEntity) => id`, filename: source, options },
    // A rest parameter is a list of what the type names, under a name the signature gives it.
    { code: `${declarations}const read = (...userEntities: UserEntity[]) => userEntities`, filename: source, options },
    // A prefix is kept while another value of the type shares the scope.
    {
      code: `${declarations}const read = () => {\n  const userEntity = findUser()\n  const existingUserEntity = findUser()\n\n  return [userEntity, existingUserEntity]\n}`,
      filename: source,
      options,
    },
    // The name the rule would propose is already taken, so the declaration keeps the one it has.
    {
      code: `${declarations}const read = () => {\n  const userEntity = 1\n  const entity = findUser()\n\n  return [userEntity, entity]\n}`,
      filename: source,
      options,
    },
    // An annotation that carries an argument is read by the checker rather than by what the author wrote.
    { code: 'const userEntities: Array<string> = []', filename: source, options },
  ],
  invalid: [
    // A constant takes the type in screaming case after what it had.
    {
      code: `${declarations}const DEFAULT = findUser()`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}const DEFAULT_USER_ENTITY = findUser()`,
    },
    // A parameter the function does not read keeps its mark.
    {
      code: `${declarations}const read = (_entity: UserEntity) => 1`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}const read = (_userEntity: UserEntity) => 1`,
    },
    // A parameter with a default is renamed where it is declared.
    {
      code: `${declarations}const read = (entity: UserEntity = findUser()) => entity`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}const read = (userEntity: UserEntity = findUser()) => userEntity`,
    },
    // A property parameter is a field, so every `this.<name>` of the class is renamed with it.
    {
      code: `${declarations}class UserService {\n  constructor(private readonly entity: UserEntity) {}\n\n  read() {\n    return this.entity.id\n  }\n}`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}class UserService {\n  constructor(private readonly userEntity: UserEntity) {}\n\n  read() {\n    return this.userEntity.id\n  }\n}`,
    },
    // The `@param` tag that documents the parameter follows the rename.
    {
      code: `${declarations}/**\n * Reads one user.\n *\n * @param entity - What was read.\n */\nconst read = (entity: UserEntity) => entity.id`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}/**\n * Reads one user.\n *\n * @param userEntity - What was read.\n */\nconst read = (userEntity: UserEntity) => userEntity.id`,
    },
    // A name of several words keeps what is its own before the type.
    {
      code: `${declarations}const read = () => {\n  const status = findStatus()\n  const runningStatus = findStatus()\n\n  return [status, runningStatus]\n}`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }, { messageId: 'notNamedByType' }],
      // One pass renames the first; the second is reported again on the next one.
      output: `${declarations}const read = () => {\n  const activityStatus = findStatus()\n  const runningStatus = findStatus()\n\n  return [activityStatus, runningStatus]\n}`,
    },
    // A name that shares no word with the type keeps all of it as a prefix.
    {
      code: `${declarations}const value = findUser()`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}const valueUserEntity = findUser()`,
    },
    // A declaration in a nested block is looked up from the block outwards.
    {
      code: `${declarations}const read = () => {\n  if (findUser()) {\n    const entity = findUser()\n\n    return entity\n  }\n\n  return null\n}`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}const read = () => {\n  if (findUser()) {\n    const userEntity = findUser()\n\n    return userEntity\n  }\n\n  return null\n}`,
    },
    // A prefix is judged from the block outwards, so a value of the type in the function above is found.
    {
      code: `${declarations}const read = () => {\n  const activityStatus = findStatus()\n  if (activityStatus) {\n    const entity = findUser()\n\n    return entity\n  }\n\n  return activityStatus\n}`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}const read = () => {\n  const activityStatus = findStatus()\n  if (activityStatus) {\n    const userEntity = findUser()\n\n    return userEntity\n  }\n\n  return activityStatus\n}`,
    },
    // A tag that documents another parameter stays as it is while this one is renamed.
    {
      code: `${declarations}/**\n * Reads one user.\n *\n * @param entity - What was read.\n * @param other - Something else.\n */\nconst read = (entity: UserEntity, other: string) => other`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}/**\n * Reads one user.\n *\n * @param userEntity - What was read.\n * @param other - Something else.\n */\nconst read = (userEntity: UserEntity, other: string) => other`,
    },
    // A comment that carries no tag for the parameter is left as it stands.
    {
      code: `${declarations}/** Reads one user. */\nconst read = (entity: UserEntity) => entity.id`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}/** Reads one user. */\nconst read = (userEntity: UserEntity) => userEntity.id`,
    },
    // A list wrongly named in the singular takes the plural of the type.
    {
      code: `${declarations}const userEntity = findUsers()`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declarations}const userEntities = findUsers()`,
    },
    {
      code: `${declaration}const entity = findUser()`,
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: `${declaration}const userEntity = findUser()`,
    },
    {
      code: `${declaration}const read = () => {\n  const existingUserEntity = findUser()\n\n  return existingUserEntity.id\n}`,
      filename: source,
      options,
      errors: [{ messageId: 'lonePrefix' }],
      output: `${declaration}const read = () => {\n  const userEntity = findUser()\n\n  return userEntity.id\n}`,
    },
    {
      code: 'interface UserEntity { id: string }\nconst read = (entity: UserEntity) => entity.id',
      filename: source,
      options,
      errors: [{ messageId: 'notNamedByType' }],
      output: 'interface UserEntity { id: string }\nconst read = (userEntity: UserEntity) => userEntity.id',
    },
  ],
})

ruleTester.run('variable-by-type, on a value the render writes as an element', variableByType, {
  valid: [
    /*
     * JSX reads a lowercase name as a tag of the language, so renaming a component to the camel case of its type
     * takes it out of the render and puts an unknown element in its place.
     */
    {
      code: 'const Icon: ComponentType = icons[name]\n\nexport const Badge = () => <Icon />',
      filename: sourceFile('components', 'badge.tsx'),
      options,
    },
    // `this` annotates the receiver rather than declaring a parameter, and renaming it changes the arity.
    {
      code: 'export const hide = () => {\n  Document.prototype.getAnimations = function (this: Document) {\n    return []\n  }\n}',
      filename: sourceFile('users', 'users.service.ts'),
      options,
    },
    // A shape says how a value is built, not what it is, and a name built on one reads worse than the author's.
    {
      code: 'const popup: Date = new Date()',
      filename: sourceFile('users', 'users.service.ts'),
      options: [{ ...EMPTY_OPTIONS, shapelessTypes: ['Date'] }],
    },
  ],
  invalid: [],
})
