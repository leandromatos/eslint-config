# architecture/barrel-per-directory

A directory that holds source files has a barrel, and a module root has none.

The barrel is what another module imports: `@/users/services` says which layer it is talking to. A
module root barrel is the one that cannot exist. Importing one entity would import the whole
module, and two modules that need each other stop being a cycle in the domain and become one in
the module graph.

## Rule details

👎 Incorrect:

```plaintext
src/users/services/users.service.ts   ← no index.ts beside it
src/users/index.ts                    ← a module root barrel
```

👍 Correct:

```plaintext
src/users/services/users.service.ts
src/users/services/index.ts
src/users/users.module.ts             ← reached by its own path
src/database/scripts/migration.script.ts ← an executed folder, imported by nobody
```

## Options

| Option            | Type       | What it decides                                                      |
| ----------------- | ---------- | -------------------------------------------------------------------- |
| `rootContexts`    | `string[]` | Directories under `src/` that are contexts of their own              |
| `executedFolders` | `string[]` | Folders a runtime executes directly, so nothing imports them by name |
| `testFolder`      | `string`   | The tree that needs no barrel                                        |

## Fixable

No. What a barrel exports is the directory's public surface, which the author decides.

## When not to use it

A codebase that imports by file path on purpose, or one where barrels cost more than they give
(bundling, circular imports).
