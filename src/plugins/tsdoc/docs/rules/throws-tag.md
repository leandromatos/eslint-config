# tsdoc/throws-tag

A documented function names every exception it constructs, one `@throws` per type, as TSDoc spells
it: the type bare, then the condition.

The signature says nothing about what a function throws, so the tag is the only place a caller
learns it without reading the body. A type in braces is JSDoc and a `{@link}` is a link, both of
which the TSDoc parser reads as text rather than as the type thrown.

## Rule details

👎 Examples of **incorrect** code:

```typescript
/**
 * Reads a user.
 *
 * @throws {NotFoundException} When no user goes by that identifier.
 */
async findOneUser(userId: string): Promise<UserEntity> {
  throw new NotFoundException({ title: 'User not found.' })
}

/** Reads a user. */
async findOneUser(userId: string): Promise<UserEntity> {
  throw new NotFoundException({ title: 'User not found.' })
}
```

👍 Examples of **correct** code:

```typescript
/**
 * Reads a user.
 *
 * @throws NotFoundException When no user goes by that identifier.
 * @throws InternalServerErrorException When finding the user fails.
 */
async findOneUser(userId: string): Promise<UserEntity> {
  throw new NotFoundException({ title: 'User not found.' })
}
```

## Options

None.

## Fixable

Yes. The fix adds the missing tag and normalizes `{Type}` and `{@link Type}` to the bare type. An
internal error whose title reads `Error while {action}.` becomes `@throws X When {action} fails.`;
any other title becomes the condition as the caller will read it.

## When not to use it

A codebase that documents failures elsewhere, such as a contract file, or one whose exceptions are
all thrown by helpers rather than constructed in place.
