# architecture/one-export-per-util

A utility file inside a module is named after the one function it exports, or after the subject
several related functions share.

What it is never named after is one of the functions inside a file that holds others: the next
reader looks for `buildSelectQuery` and finds a file called after its neighbour. The root utility
folder is named by domain and grows, so it is left out with the other root contexts.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// src/files/utils/remove-extension.util.ts
export const removeExtension = (name: string): string => {}
export const readExtension = (name: string): string => {} // the file names one of two
```

👍 Examples of **correct** code:

```typescript
// src/files/utils/remove-extension.util.ts
export const removeExtension = (name: string): string => {}

// src/files/utils/extension.util.ts, where the subject names the file that holds both
export const removeExtension = (name: string): string => {}
export const readExtension = (name: string): string => {}

// src/utils/string.util.ts, where the root folder is named by domain and grows
```

## Options

| Option         | Type       | What it decides                                    |
| -------------- | ---------- | -------------------------------------------------- |
| `rootContexts` | `string[]` | The directories under `src/` the rule leaves alone |
| `testFolder`   | `string`   | The tree the rule leaves alone                     |

## Fixable

No. Splitting a file or renaming it changes what imports it.

## When not to use it

A codebase whose utilities are grouped by domain everywhere, not only at the root.
