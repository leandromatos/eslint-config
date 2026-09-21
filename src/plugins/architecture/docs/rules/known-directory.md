# architecture/known-directory

Every directory under a module is on the closed list the options carry.

A directory that is not on the list is a responsibility nobody declared: the next reader has to
open it to learn what it holds, and the layer rules, the ones that decide where a file goes and what it may import, have
nothing to say about it. Adding the row to the options is the decision; the directory follows.

## Rule details

👎 Incorrect: a module with a directory the options do not name.

```plaintext
src/users/
├── controllers/
├── helpers/        ← not on the list
└── services/
```

👍 Correct:

```plaintext
src/users/
├── controllers/
├── services/
├── utils/          ← the row the options carry for helpers
└── types/          ← a mirror folder, also declared
```

## Options

| Option           | Type                     | What it decides                                                          |
| ---------------- | ------------------------ | ------------------------------------------------------------------------ |
| `suffixToFolder` | `Record<string, string>` | The folders a layer may have, one per suffix                             |
| `mirrorFolders`  | `string[]`               | The folders that mirror the tree instead of being a layer                |
| `rootContexts`   | `string[]`               | The directories under `src/` that are contexts of their own, not modules |
| `testKinds`      | `string[]`               | The folders a test tree may hold                                         |

## Fixable

No. Where the files of an unknown directory belong is a decision per file.

## When not to use it

A codebase that groups by feature without a fixed set of responsibilities, or one still finding its
layers.
