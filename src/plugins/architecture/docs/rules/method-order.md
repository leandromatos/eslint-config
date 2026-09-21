# architecture/method-order

The methods of a class in an ordered layer come in two blocks, public then private, each in
alphabetical order.

What the class does for others reads first; what it does for itself reads after. Within a block a
method is found by its name, in the same place in every layer, so reading a second service costs
nothing once the first was read.

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

| Option            | Type       | What it decides                                      |
| ----------------- | ---------- | ---------------------------------------------------- |
| `orderedSuffixes` | `string[]` | The file suffixes whose classes are ordered this way |

## Fixable

Yes. The fix swaps adjacent members, each with its comments and decorators, and keeps whatever
sits between them.

## When not to use it

A class whose reading order is the flow it performs rather than the surface it offers, such as a
state machine or a pipeline.
