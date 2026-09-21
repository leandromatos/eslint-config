# architecture/mirrored-source

A file under a mirror folder mirrors a file in the tree beside that folder.

A mirror exists so that finding the type of a service, or the spec of a factory, is the same walk
as finding the service or the factory. A file that mirrors nothing is a file whose source was
renamed, moved or deleted, and nothing else notices.

## Rule details

👎 Incorrect: the mirror outlived its source.

```plaintext
src/users/services/users.service.ts
src/users/types/services/user-profile.service.type.ts   ← mirrors nothing
```

👍 Correct:

```plaintext
src/users/services/users.service.ts
src/users/types/services/users.service.type.ts
src/users/__tests__/unit/services/users.service.spec.ts
src/users/types/users.type.ts                            ← the module's own vocabulary
src/users/__tests__/e2e/users.spec.ts                    ← a kind that mirrors nothing by design
```

## Options

| Option                    | Type                     | What it decides                                                                    |
| ------------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `suffixToFolder`          | `Record<string, string>` | Which folder holds which layer                                                     |
| `mirrorFolders`           | `string[]`               | The folders that mirror the tree                                                   |
| `testFolder`, `testKinds` | `string`, `string[]`     | Where tests live and which kinds exist                                             |
| `mirroringTestKinds`      | `string[]`               | The kinds whose specs mirror one source; the others assert a property of the whole |

## Fixable

No. Whether the source was renamed or the mirror is stale is not the rule's to guess.

## When not to use it

A codebase that keeps tests and types beside the code.
