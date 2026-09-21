# tsdoc/comment-form

An implementation note is a line while it fits on one, and a block once it runs to a paragraph.
Either form is wrapped at the column the formatter wraps code at.

A paragraph written as a stack of `//` lines reads as several notes and moves as one, and the next
person to add a sentence has to repeat the marker to keep it together. The formatter never rewraps
a comment, so the column is the rule's to hold.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// The last cursor is the tiebreaker, and it has to be unique: two activities can start on
// the same second, and a page boundary landing inside that group would skip a row.
const cursors = buildCursors()

/** A summary that runs past the column the formatter wraps code at, and keeps going well beyond it into a second screen. */
```

👍 Examples of **correct** code:

```typescript
/*
 * The last cursor is the tiebreaker, and it has to be unique: two activities can start on the same
 * second, and a page boundary landing inside that group would skip a row.
 */
const cursors = buildCursors()

// One line, one note.
const isCurrent = session.id === currentSessionId

// eslint-disable-next-line no-console
console.log(message) // a directive is a line by contract
```

## Options

| Option         | Type     | What it decides                                                                  |
| -------------- | -------- | -------------------------------------------------------------------------------- |
| `commentWidth` | `number` | The column a comment is wrapped at, which is the one the formatter wraps code at |

## Fixable

Yes. The fix joins the lines into a block and rewraps it; inside a documentation comment a blank
line and a tag each open a paragraph of their own, so a `@param` is never folded into the sentence
above it.

## When not to use it

A codebase whose formatter already rewraps comments, or one that keeps ASCII art or tables in
comments, which a rewrap would destroy.
