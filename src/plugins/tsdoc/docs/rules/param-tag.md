# tsdoc/param-tag

A documented function lists every parameter it takes in a `@param`, in the order of the signature,
once, with a description.

The signature gives the name and the type of each parameter, and the tag is the only place that says
what the caller hands over. A tag that names a parameter the function no longer takes, or names them
out of order, tells the caller something the code does not do.

The implementation of an overloaded function is asked for no tag: each signature carries its own,
and a comment over the implementation is a note for the next person to edit it.

## Rule details

👎 Examples of **incorrect** code:

```typescript
/** Reads a user. */
const findOneUser = (userId: string, include: UserIncludeOption[]) => {}

/**
 * Sums two numbers.
 *
 * @param right - The second.
 * @param left - The first.
 */
const sum = (left: number, right: number) => left + right

/**
 * Reads a user.
 *
 * @param userId
 */
const findOneUser = (userId: string) => {}
```

👍 Examples of **correct** code:

```typescript
/**
 * Sums two numbers.
 *
 * @param left - The first.
 * @param right - The second.
 */
const sum = (left: number, right: number) => left + right

/**
 * Reads a user.
 *
 * @param params - The route, which names the user.
 */
const findOneUser = ({ userId }: FindOneUserParams) => {}

class Repository {
  /**
   * Sets the limit.
   *
   * @param value - How many rows a page holds.
   */
  set limit(value: number) {}
}
```

Every function is asked: one with a body, a declared one, a setter, a method without a body, an
overload, an interface method and an interface property typed as a function. A destructured
parameter carries one `@param` for the whole object, under any name, because TSDoc writes no path
into it. A parameter typed by an object literal is a named one. `this` is the receiver and takes
none, and a comment carrying `{@inheritDoc}` documents nothing here, so it is not asked.

The comment is the `/**` block right above the statement that holds the function: the declaration,
the export, the variable, the member, the return, or the assignment. A function handed straight to a
call carries it right before itself.

## Options

None.

## Fixable

No.

## When not to use it

A codebase that documents parameters in a type rather than in the comment of the function.
