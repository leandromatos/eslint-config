# leandromatos/architecture-argument-passed-whole

A layer that receives an object the options name passes it on whole, never a field of it.

`service.deleteUser(params)` survives the route growing a second parameter, and every call site keeps saying which
layer it is talking to. `service.deleteUser(params.userId)` does neither.

## Rule details

👎 Examples of **incorrect** code, in a file of the `controller` suffix that passes `params`, `query` and `body` whole:

```typescript
async deleteUser(params: DeleteUserParams): Promise<void> {
  await this.usersService.deleteUser(params.userId)
}

async findAllUsers(query: FindAllUsersQuery): Promise<UserEntity[]> {
  return this.usersService.findAllUsers(query.limit)
}
```

👍 Examples of **correct** code:

```typescript
async deleteUser(params: DeleteUserParams): Promise<void> {
  await this.usersService.deleteUser(params)
}

// A field of something the options do not name is read freely.
async findOneUser(params: FindOneUserParams): Promise<UserEntity> {
  return this.usersService.findOneUser(params, this.tenantId)
}
```

## Options

Read from the `architecture` group of the options.

| Option           | Type              | What it decides                                                             |
| ---------------- | ----------------- | --------------------------------------------------------------------------- |
| `wholeArguments` | `WholeArgument[]` | `{ suffix, objects }`: in the files of one suffix, the objects passed whole |

The `nestjs` tier names `params`, `query` and `body` for the `controller` suffix.

## Fixable

No. Which method the call reaches, and with what, is the author's to decide.

## When not to use it

A codebase whose layers take primitives by design, or one with no layer boundary to keep.
