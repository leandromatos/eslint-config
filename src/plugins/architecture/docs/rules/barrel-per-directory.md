# leandromatos/architecture-barrel-per-directory

A directory that holds source files has a barrel, and a module root has none.

The barrel is what another module imports: `@/users/services` says which layer it is talking to. A barrel at the root
of a module is the one that cannot exist. Importing one entity would import the whole module, and two modules that
need each other stop being a cycle in the domain and become one in the module graph.

## Rule details

👎 Incorrect:

```plaintext
src/users/services/users.service.ts   ← no index.ts beside it
src/users/index.ts                    ← a barrel at the root of a module
```

👍 Correct:

```plaintext
src/users/services/users.service.ts
src/users/services/index.ts
src/users/users.module.ts                       ← reached by its own path
src/users/scripts/backfill.script.ts            ← an executed folder, imported by nobody
src/users/services/__mocks__/users.service.ts   ← a stand-in, read by the test runner
src/libs/session/index.ts                       ← a module of a barrelled container, imported whole
```

A directory a package publishes as an entrypoint keeps the barrel at its root, since that barrel is what the
entrypoint names.

## Options

Read from the `architecture` group of the options.

| Option                | Type       | What it decides                                                           |
| --------------------- | ---------- | ------------------------------------------------------------------------- |
| `rootContexts`        | `string[]` | the directories under the source root that are contexts of their own      |
| `moduleContainers`    | `string[]` | the directories that hold modules, so the root of a module sits under one |
| `barrelledContainers` | `string[]` | the containers whose modules are imported whole, through a root barrel    |
| `mirrorFolders`       | `string[]` | the folders that mirror the sources, which hold no module                 |
| `executedFolders`     | `string[]` | the folders a runtime executes directly, so nothing imports them by name  |
| `testFolder`          | `string`   | the tree that needs no barrel                                             |
| `mockFolder`          | `string`   | the folder of stand-ins, which the test runner reads by module name       |

## Fixable

No. What a barrel exports is the public surface of the directory, which the author decides.

## When not to use it

A codebase that imports by file path on purpose, or one where barrels cost more than they give.
