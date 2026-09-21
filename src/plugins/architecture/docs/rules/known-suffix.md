# architecture/known-suffix

Every file carries a known suffix, and sits under the folder that suffix names.

The suffix is what says which layer a file belongs to, and the folder is what says where to look
for it. When the two can disagree, a reader has to open the file to know what it is, and every rule
that reads the suffix is judging something the path denies.

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
```

## Options

| Option               | Type                     | What it decides                                        |
| -------------------- | ------------------------ | ------------------------------------------------------ |
| `suffixToFolder`     | `Record<string, string>` | Suffix to the folder that holds it                     |
| `folderlessSuffixes` | `string[]`               | Suffixes with no folder of their own, such as `module` |

## Fixable

No. Renaming a file or moving it changes what imports it, which is a decision rather than a
transformation.

## When not to use it

A codebase whose file names carry no layer, or one that groups by feature folder with an
`index.ts` per concept.
