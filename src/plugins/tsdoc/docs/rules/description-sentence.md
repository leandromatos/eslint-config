# tsdoc/description-sentence

The description of a documented function, and the text of its `@param`, `@returns` and `@throws`,
read as sentences.

A sentence opens with a capital and closes with its punctuation, so a reader meets the same shape in
every comment and in every tag.

## Rule details

👎 Examples of **incorrect** code:

```typescript
/**
 * reads a user
 *
 * @param userId - the user
 * @throws NotFoundException when no user goes by that identifier
 */
const findOneUser = (userId: string) => {}
```

👍 Examples of **correct** code:

````typescript
/**
 * Reads a user.
 *
 * @param userId - The unique identifier of the user.
 * @throws NotFoundException When no user goes by that identifier.
 */
const findOneUser = (userId: string) => {}

/**
 * `null` stands for an empty page, and the example ends on a fence:
 *
 * ```ts
 * findAll()
 * ```
 */
const findAll = () => {}
````

A sentence opens with a capital, a digit, an underscore or a backtick, and closes with a period, a
question mark, an exclamation mark, a backtick or an emoji. The hyphen TSDoc writes before the text
of a `@param` and a `@returns` is not part of the text. An empty text, and a bare hyphen, are left
to `tsdoc/param-tag` and `tsdoc/returns-tag`, which ask for one.

## Options

None.

## Fixable

No.

## When not to use it

A codebase whose comments are notes rather than prose.
