# architecture/argument-passed-whole

A layer that receives an object the options name passes it on whole, never a field of it.

`service.deleteUser(params)` survives the route growing a second parameter, and every call site
keeps saying which layer it is talking to; `service.deleteUser(params.userId)` does neither.

## Rule details

👎 Examples of **incorrect** code:

```typescript
@Delete('users/:userId')
async deleteUser(@Param() params: DeleteUserParams): Promise<void> {
  await this.usersService.deleteUser(params.userId)
}
```

👍 Examples of **correct** code:

```typescript
@Delete('users/:userId')
async deleteUser(@Param() deleteUserParams: DeleteUserParams): Promise<void> {
  await this.usersService.deleteUser(deleteUserParams)
}

@Post('users')
async createUser(@Body() createUserBody: CreateUserBody, @Request() request: RequestWithUserEntity) {
  await this.usersService.createUser(createUserBody, request.user) // the request is the exception
}
```

## Options

| Option           | Type              | What it decides                                                            |
| ---------------- | ----------------- | -------------------------------------------------------------------------- |
| `wholeArguments` | `WholeArgument[]` | `{ suffix, objects }`: in files of one suffix, the objects passed on whole |

## Fixable

No. Which method the call should reach, and with what, is the author's call.

## When not to use it

A codebase whose layers take primitives by design, or one with no layer boundary to keep.
