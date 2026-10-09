# leandromatos/tsdoc-comment-form

An implementation note is a line comment while it fits on one line, and a block comment once it runs to a paragraph.
Either form is wrapped at the column the formatter wraps code at.

A paragraph written as a stack of `//` lines reads as several notes and moves as one, and the next person to add a
sentence repeats the marker to keep it together. A block around one line spends three lines on it. The formatter never
rewraps a comment, so the column is the rule's to hold.

In a documentation comment, a blank line separates the summary from the first tag. The text a reader looks for and the
tags a tool reads each open a paragraph of their own.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// The last cursor is the tiebreaker, and it has to be unique: two activities can start on
// the same second, and a page boundary landing inside that group would skip a row.
const cursors = buildCursors()

/* The cache answers first. */
const user = readUser()

/**
 * Reads one user.
 * @param userId - The user to read.
 */
```

👍 Examples of **correct** code:

```typescript
/*
 * The last cursor is the tiebreaker, and it has to be unique: two activities can start on the same second, and a page
 * boundary landing inside that group would skip a row.
 */
const cursors = buildCursors()

// The cache answers first.
const user = readUser()

/**
 * Reads one user.
 *
 * @param userId - The user to read.
 */

// eslint-disable-next-line no-console
console.log(message) // a directive is a line by contract

const read = (/* the id */ id: string) => id // a note beside code stays where it is
```

## Options

Read from the `tsdoc` group of the options.

| Option         | Type     | What it decides                                                                  |
| -------------- | -------- | -------------------------------------------------------------------------------- |
| `commentWidth` | `number` | the column a comment is wrapped at, which is the one the formatter wraps code at |

`strict` wraps at 80, the column Prettier wraps code at by default, and the `CONTROLLED_LANGUAGE` preset at 120.

## Fixable

Yes. A run of line comments becomes one line comment when it fits on one line, and a block wrapped at the column when
it does not. A block note of one line becomes a line comment. Inside a documentation comment a blank line and a tag
each open a paragraph of their own, so a `@param` is never folded into the sentence above it, and a first tag that
runs into the summary gets a blank line above it. A code span moves to the next line whole, because TSDoc closes a
span on the line it opens on.

## When not to use it

A codebase whose formatter already rewraps comments, or one that keeps ASCII art or tables in comments, which a rewrap
would destroy.
