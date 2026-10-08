# tsdoc/throws-tag

A documented function names every exception it constructs, one `@throws` per type, as TSDoc spells
it: the type bare, then the condition.

The signature says nothing about what a function throws, so the tag is the only place a caller
learns it without reading the body. A type in braces is JSDoc and a `{@link}` is a link, both of
which the TSDoc parser reads as text rather than as the type thrown.

Every tag opens with that type. A tag that opens with a sentence, such as
`@throws Will throw an error when…`, names nothing a caller can catch, and the hyphen a `@param`
writes before its text has no place after the type: `@throws NotFoundException When…`, not
`@throws NotFoundException - When…`.

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

/**
 * Reads a user.
 *
 * @throws Will throw when no user goes by that identifier.
 * @throws NotFoundException - When no user goes by that identifier.
 */
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

Yes. The fix adds the missing tag, normalizes `{Type}` and `{@link Type}` to the bare type, and drops the hyphen after the type. A tag that names no type is reported and left alone: only the author knows the type. An
internal error whose title reads `Error while {action}.` becomes `@throws X When {action} fails.`;
any other title becomes the condition as the caller will read it.

## When not to use it

A codebase that documents failures elsewhere, such as a contract file, or one whose exceptions are
all thrown by helpers rather than constructed in place.
