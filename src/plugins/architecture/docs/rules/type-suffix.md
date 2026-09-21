# architecture/type-suffix

An exported type that uses one of the governed suffixes uses it at the end of its name, and uses
one that belongs to the folder it is declared under.

The suffix says what kind of thing the type is, what a repository returns or what a job carries,
so reading it from the wrong folder means the name promises something the file cannot keep. A name
that uses no governed suffix is a concept, and is left alone.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// src/users/types/services/users.service.type.ts
export interface UserSelectAttributes {} // a repository suffix under services/
export interface InputCreateUser {} // the suffix is not at the end
```

👍 Examples of **correct** code:

```typescript
// src/users/types/repositories/users.repository.type.ts
export interface UserSelectAttributes {}

// src/users/types/services/users.service.type.ts
export interface CreateUserInput {}

// src/users/types/users.type.ts
export interface UserRole {} // a concept, governed by no suffix
```

## Options

| Option           | Type                       | What it decides                                                    |
| ---------------- | -------------------------- | ------------------------------------------------------------------ |
| `typeSuffixes`   | `Record<string, string[]>` | Folder to the suffixes a type declared under its mirror may end in |
| `suffixToFolder` | `Record<string, string>`   | Which folder is the types folder                                   |

## Fixable

No. The right suffix is a statement about what the type is.

## When not to use it

A codebase whose types are named after the domain alone, with no kind in the name.
