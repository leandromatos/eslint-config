# leandromatos/architecture-known-directory

Every directory under a module is on the closed list the options carry.

A directory that is not on the list is a responsibility nobody declared: the next reader opens it to learn what it
holds, and the rules that decide where a file goes and what it may import have nothing to say about it. Adding the
row to the options is the decision; the directory follows.

A directory at the root of a module that holds layers of its own is a context rather than a responsibility: a driver
inside the capability it implements, such as `cache/keyv/` with its `services/` and `types/`. The list judges the
directories inside it the way it judges a module's.

Below the mock folder, a directory is part of the path of what a stand-in imitates, as the scope of
`__mocks__/@scope/package.tsx` is, so the list does not judge it.

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

src/cache/
├── cache.module.ts
└── keyv/           ← a driver: it holds layers of its own
    ├── services/
    └── types/
```

## Options

Read from the `architecture` group of the options.

| Option             | Type                     | What it decides                                                                   |
| ------------------ | ------------------------ | --------------------------------------------------------------------------------- |
| `suffixToFolder`   | `Record<string, string>` | the folders a layer may have, one per suffix                                      |
| `mirrorFolders`    | `string[]`               | the folders that mirror the tree instead of being a layer                         |
| `rootContexts`     | `string[]`               | the directories under the source root that are contexts of their own, not modules |
| `testKinds`        | `string[]`               | the folders a test tree may hold                                                  |
| `mockFolder`       | `string`                 | the folder beside a module that holds its stand-in, known anywhere                |
| `baseFolders`      | `string[]`               | the folders a module holds at its root for its base classes, such as `core`       |
| `testingFolder`    | `string`                 | the folder that holds what a package publishes for tests, known anywhere          |
| `moduleContainers` | `string[]`               | the directories that hold modules, so the directories of a module start under one |

## Fixable

No. Where the files of an unknown directory belong is a decision per file.

## When not to use it

A codebase that groups by feature without a fixed set of responsibilities, or one still finding its layers.
