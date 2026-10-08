# text/american-spelling

Every name, comment and string the code carries is spelled in American English.

One variant keeps a search finding every use: two spellings of one word are two words to grep for.
A value another system defines keeps that system's spelling, because the code compares it.

The rule reads the comments, the strings, the template literals and the markup text of a file, and
the names the file declares: its variables, functions, classes, parameters, types and the members a
class or an interface declares. What the file imports, reads off another object or writes as the
key of an object literal is named by whoever declares it, and a string that names a module is its
package's.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// Picks the colour of the badge.
const colourScheme = 'dark'
throw new BadRequestException({ title: 'Payment cancelled.' })
```

👍 Examples of **correct** code:

```typescript
// Picks the color of the badge.
const colorScheme = 'dark'
throw new BadRequestException({ title: 'Payment canceled.' })

// The provider names the field this way, so the project lists it in spellingExceptions.
const field = payload.colour
```

## Options

| Option               | Type       | What it decides                                                                              |
| -------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `spellingExceptions` | `string[]` | Words another system spells in British English, which the code keeps as written, in any case |

## Fixable

No. A rename of a name changes every place that reads it, and a string may be compared by another
system, so the change is the author's.

## When not to use it

A codebase written in British English, which holds one variant all the same.
