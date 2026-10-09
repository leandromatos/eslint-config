# leandromatos/architecture-method-order

The methods of a class in an ordered layer come in two blocks, public then private, each in alphabetical order.

What the class does for others reads first; what it does for itself reads after. Within a block a method is found by
its name, in the same place in every layer, so reading a second service costs nothing once the first was read. A
method named with `#` is private whatever it declares, and the names compare in the order English sorts them, on every
machine alike.

## Rule details

👎 Examples of **incorrect** code:

```typescript
export class UsersService {
  async findOneUser(): Promise<UserEntity> {}
  private buildUserMeta(): UserMeta {}
  async createUser(): Promise<UserEntity> {} // public after a private, and out of order
}
```

👍 Examples of **correct** code:

```typescript
export class UsersService {
  async createUser(): Promise<UserEntity> {}
  async findOneUser(): Promise<UserEntity> {}

  private buildUserMeta(): UserMeta {}
  private readUserAvatar(): UserAvatarEntity {}
}
```

## Options

Read from the `architecture` group of the options.

| Option            | Type       | What it decides                                      |
| ----------------- | ---------- | ---------------------------------------------------- |
| `orderedSuffixes` | `string[]` | the file suffixes whose classes are ordered this way |

The `nestjs` tier names `controller`, `service`, `repository`, `cache`, `transformer` and `specification`.

## Fixable

Yes. The fix reorders the methods of the class in one pass, each with the comments above it, and keeps whatever sits
between them.

## When not to use it

A class whose reading order is the flow it performs rather than the surface it offers, such as a state machine or a
pipeline.
