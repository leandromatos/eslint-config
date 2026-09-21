# architecture/types-folder

A type lives in the types folder, in a file that mirrors the source it describes, and nowhere else.

Declared beside the code, a type is found by reading the code; declared in the mirror, it is found
by the same path as everything else. A declaration file (`.d.ts`) is left alone, because ambient
declarations have nowhere else to go.

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

| Option           | Type                     | What it decides                      |
| ---------------- | ------------------------ | ------------------------------------ |
| `suffixToFolder` | `Record<string, string>` | Which folder the type suffix maps to |

## Fixable

No. Moving a declaration changes what imports it.

## When not to use it

A codebase that keeps a type beside the function it describes on purpose, which is the common
choice outside layered projects.
