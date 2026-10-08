# tsdoc/param-tag

A documented function lists every parameter it takes in a `@param`, in the order of the signature,
once, with a description.

The signature gives the name and the type of each parameter, and the tag is the only place that says
what the caller hands over. A tag that names a parameter the function no longer takes, or names them
out of order, tells the caller something the code does not do.

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

/** Reads a user. */
const findOneUser = ({ userId }: FindOneUserParams) => {}

class Repository {
  /** Sets the limit. */
  set limit(value: number) {}
}
```

A destructured parameter, or one typed by an object literal, needs no tag, and a tag at its position
may take any name. `this` is the receiver and takes none. A setter takes the value it is assigned,
and a comment carrying `@inheritDoc` documents nothing here, so neither is asked for its tags.

The comment is the `/**` block right above the statement that holds the function: the declaration,
the export, the variable, the member, the return, or the assignment. A function handed straight to a
call carries it right before itself.

## Options

| Option                | Type       | What it decides                                                     |
| --------------------- | ---------- | ------------------------------------------------------------------- |
| `requiredTagContexts` | `string[]` | The kinds of node, by AST type, whose comment is asked for its tags |

Outside those kinds the rule still compares names with the parameters, including an interface
method and an interface property typed as a function, and still asks a tag for its description in
a function.

## Fixable

No.

## When not to use it

A codebase that documents parameters in a type rather than in the comment of the function.
