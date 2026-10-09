# leandromatos/architecture-types-folder

A type lives in the types folder, in a file that mirrors the source it describes, and nowhere else.

Declared beside the code, a type is found by reading the code; declared in the mirror, it is found by the same path as
everything else. A declaration file (`.d.ts`) is left alone, because ambient declarations have nowhere else to go, and
so is a component, a hook or another suffix the options co-locate, whose props are read beside it.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// src/users/services/users.service.ts
export interface CreateUserInput {}

export class UsersService {}
```

👍 Examples of **correct** code:

```typescript
// src/users/types/services/users.service.type.ts
export interface CreateUserInput {}

// src/users/services/users.service.ts
import type { CreateUserInput } from '@/users/types'

export class UsersService {}
```

## Options

Read from the `architecture` group of the options.

| Option                  | Type                     | What it decides                                                           |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `suffixToFolder`        | `Record<string, string>` | which folder the `type` suffix maps to                                    |
| `coLocatedTypeSuffixes` | `string[]`               | the suffixes whose types are declared beside the file                     |
| `suffixFreeFolders`     | `string[]`               | the folders whose files are named by what they hold, such as `components` |

## Fixable

No. Moving a declaration changes what imports it.

## When not to use it

A codebase that keeps a type beside the function it describes on purpose, which is the common choice outside layered
projects.
