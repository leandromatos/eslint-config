# naming/variable-by-type

A variable or a parameter of a named type ends with that type's name in camel case.

The type says what the value is, and the name is read where the type is not in view: a call site, a
later line, a diff. What comes before the type name is what tells two values of one type apart, a
participle or an adjective. A name that carries only the prefix is the one value of that type in
its scope, and the prefix says nothing.

## Rule details

👎 Examples of **incorrect** code:

```typescript
const query: ConfirmEmailQuery = request.query
const user = await this.usersRepository.findOneUser(userId) // UserSelectAttributes
async deleteActivity(params: DeleteActivityParams): Promise<void>
const existingEntity: UserEntity = await this.findOne(id) // no second UserEntity in scope
```

👍 Examples of **correct** code:

```typescript
const confirmEmailQuery: ConfirmEmailQuery = request.query
const userSelectAttributes = await this.usersRepository.findOneUser(userId)
async deleteActivity(deleteActivityParams: DeleteActivityParams): Promise<void>
const userEntity: UserEntity = await this.findOne(id)
const paginatedUserEntity: PaginatedEntity<UserEntity> = await this.findAll() // genericNames
const mockedDatabase = createMock<Database>() // DeepMocked, whose word is the empty string
function handle(_request: Request): void {} // the unused mark stays
```

## Options

| Option            | Type                     | What it decides                                                                                                                             |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `genericNames`    | `Record<string, string>` | Generic types of one argument, and the word each puts before the argument's name: `PaginatedEntity` as `paginated`, `DeepMocked` as nothing |
| `verbParticiples` | `Record<string, string>` | The verbs whose result is something new, and the participle that opens the name of what they return                                         |
| `roleNames`       | `string[]`               | Names a test gives by role rather than by type, such as `result` and `expected*`                                                            |
| `testFolder`      | `string`                 | The folder where the role names apply                                                                                                       |

## Fixable

Yes. The fix renames the declaration and every reference to it, including `this.<field>` and the
`@param` tags of the documentation comment above it, and only when the new name is free in scope.

## When not to use it

A codebase that names by role rather than by type (`input`, `output`, `payload`), or one whose
types are mostly structural and unnamed.
