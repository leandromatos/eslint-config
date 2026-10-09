# leandromatos/naming-method-resource

A public method of a layer class carries the resource of the file in its name.

The method is read at the call site, where the file name is not in view: `usersService.findOne()` says less than
`usersService.findOneUser()`. A name may carry the resource in its singular or its plural, and a resource of several
words in whole or by its last word: `CredentialToken`, `CredentialTokens`, `Token` and `Tokens` for
`credential-tokens`.

## Rule details

👎 Examples of **incorrect** code:

```typescript
export class UsersService {
  async findOne(params: FindOneUserParams): Promise<UserEntity> {}
}
```

👍 Examples of **correct** code:

```typescript
export class UsersService {
  async findOneUser(findOneUserParams: FindOneUserParams): Promise<UserEntity> {}
}

export class AuthService {
  async login(body: LoginBody): Promise<TokenEntity> {} // a resource-free stem names it once
}

export class OAuthSessionsService {
  async onApplicationBootstrap(): Promise<void> {} // a hook the framework calls by contract
}
```

## Options

Read from the `naming` group of the options.

| Option                | Type       | What it decides                                                                 |
| --------------------- | ---------- | ------------------------------------------------------------------------------- |
| `resourceSuffixes`    | `string[]` | the file suffixes whose public methods carry the resource                       |
| `resourceFreeStems`   | `string[]` | the stems whose resource is the verb's own subject, so their methods carry none |
| `resourceFreeMethods` | `string[]` | the method names a framework calls by contract                                  |

The `nestjs` tier names `cache`, `controller`, `repository` and `service`, and the hooks Nest calls by contract.

## Fixable

No. Where the resource goes in the name is the author's call: `findOneUser`, `findUserByEmail`.

## When not to use it

A codebase whose classes are imported under the name of their resource, so the call site already carries it.
