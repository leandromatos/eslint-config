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
const drain = (): Promise<void> =>
  new Promise(resolve => {
    queue.once('drained', () => resolve())
  })
```

A function hands a value back when a `return` in its own body carries one, or when an arrow writes
an expression for its body. A declared function or an interface method hands one back when its
return type is not `void`, `undefined` or `never`. A promise a `return` builds in place hands back
nothing when its executor resolves it empty.

A constructor builds the instance, and a comment carrying `@inheritDoc` documents nothing here, so
neither is asked. An async function or a generator hands back a promise or an iterator whatever its
body returns, so a tag on one is never reported as unexpected.

## Options

| Option                | Type       | What it decides                                                    |
| --------------------- | ---------- | ------------------------------------------------------------------ |
| `requiredTagContexts` | `string[]` | The kinds of node, by AST type, whose comment is asked for the tag |

## Fixable

No.

## When not to use it

A codebase whose return types carry names that say what the value means, and that documents no
return.
