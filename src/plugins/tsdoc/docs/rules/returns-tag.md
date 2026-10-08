# tsdoc/returns-tag

A documented function carries one `@returns` with a description when it hands a value back, and
none when it does not.

The return type says what comes back, and the tag says what it means. A function that hands nothing
back has nothing to describe, so a tag there describes a value that does not exist.

## Rule details

👎 Examples of **incorrect** code:

```typescript
/** Counts the users. */
const countUsers = (): number => users.length

/**
 * Logs the message.
 *
 * @returns The message.
 */
function log(message: string): void {
  console.log(message)
}

/**
 * Saves the user.
 *
 * @returns Nothing.
 */
async function saveUser(user: UserEntity): Promise<void> {
  await repository.save(user)
}

/**
 * Counts the users.
 *
 * @returns
 */
const countUsers = (): number => users.length
```

👍 Examples of **correct** code:

```typescript
/**
 * Counts the users.
 *
 * @returns How many there are.
 */
const countUsers = (): number => users.length

/** Waits for the queue to drain. */
const drain = async (): Promise<void> => {
  await queue.drained()
}

/** Waits for the next tick. */
const tick = (): Promise<void> =>
  new Promise(resolve => {
    setTimeout(() => resolve())
  })
```

The type the signature hands back decides first. `void`, `undefined` and `never`, or a promise of
one of them, hand back nothing, async or not, so a `@returns` there is reported. A generator hands
back values when its own body yields one or returns one. Past the type, an arrow with an expression
for its body hands a value back, and so does a function whose own `return` carries one. A promise a
`return` builds in place hands back nothing when its executor resolves it empty.

Every function is read: one with a body, a declared one, a method without a body, an overload, an
interface method and an interface property typed as a function. A constructor builds the instance,
so it is left out, and a comment carrying `{@inheritDoc}` is not asked for the tag. A second tag is
always one too many.

The rule reads types, so it runs where the parser has a project.

## Options

None.

## Fixable

No.

## When not to use it

A codebase whose return types carry names that say what the value means, and that documents no
return.
