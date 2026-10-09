# leandromatos/architecture-known-suffix

Every file carries a known suffix, and sits under the folder that suffix names.

The suffix says which layer a file belongs to, and the folder says where to look for it. When the two can disagree,
a reader opens the file to know what it is, and every rule that reads the suffix judges something the path denies.

A stand-in in the mock folder carries the name of what it imitates, as the test runner reads it: `__mocks__/zustand.ts`,
`__mocks__/@scope/package.tsx`. Only its name is spared; every other rule reads it. A file named after the context it
sits in is the root of that context and sits above the layers, the way `users.module.ts` sits at the root of `users/`.

## Rule details

👎 Examples of **incorrect** paths:

```plaintext
src/users/services/users.ts            ← no suffix
src/users/services/users.helper.ts     ← a suffix the options do not know
src/users/services/users.repository.ts ← a repository under services/
```

👍 Examples of **correct** paths:

```plaintext
src/users/services/users.service.ts
src/users/repositories/users.repository.ts
src/users/users.module.ts              ← a folderless suffix
src/users/services/index.ts            ← a barrel carries no suffix
src/components/user-card.tsx           ← a folder whose files are named by what they hold
```

## Options

Read from the `architecture` group of the options.

| Option               | Type                     | What it decides                                                              |
| -------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `suffixToFolder`     | `Record<string, string>` | suffix to the folder that holds it                                           |
| `folderlessSuffixes` | `string[]`               | suffixes with no folder of their own, such as `module`                       |
| `suffixFreeFolders`  | `string[]`               | folders whose files are named by what they hold, such as `components`        |
| `mirrorFolders`      | `string[]`               | folders that hold the files of other layers, such as `types`                 |
| `baseFolders`        | `string[]`               | folders at the root of a module whose files are base classes, such as `core` |
| `moduleContainers`   | `string[]`               | the directories that hold modules, so the root of a module sits under one    |
| `mockFolder`         | `string`                 | the folder of stand-ins, named after what they imitate                       |

## Fixable

No. Renaming a file or moving it changes what imports it, which is a decision rather than a transformation.

## When not to use it

A codebase whose file names carry no layer, or one that groups by feature folder with an `index.ts` per concept.
