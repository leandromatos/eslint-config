# leandromatos/tsdoc-typeless-tag

A `@param` or a `@returns` carries no type in braces.

TypeScript declares the type in the signature, and TSDoc writes none in the comment. A type there repeats the
signature, and it goes stale the day the signature changes.

## Rule details

👎 Examples of **incorrect** code:

```typescript
/**
 * Reads a user.
 *
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<UserEntity>} The user.
 */
const findOneUser = (userId: string): Promise<UserEntity> => {}
```

👍 Examples of **correct** code:

```typescript
/**
 * Reads a user.
 *
 * @param userId - The unique identifier of the user.
 * @returns The user.
 */
const findOneUser = (userId: string): Promise<UserEntity> => {}
```

The rule reads every documentation comment of the file, whatever it documents. A type on a `@throws` is the business
of `tsdoc-throws-tag`.

## Options

None.

## Fixable

Yes. The fix takes the type out of the line, braces and all. A brace that never closes is left as it is, because there
is no telling where the type ends.

## When not to use it

A JavaScript codebase, where the comment is the only place a type can live.
