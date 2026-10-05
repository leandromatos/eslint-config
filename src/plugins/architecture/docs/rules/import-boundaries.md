# architecture/import-boundaries

A file reaches another layer through its barrel, and its own layer directly.

A layer is a folder of files that share a suffix, and its barrel is what the rest of the project
imports. Naming a file across a layer skips the barrel, which is the one place a layer decides what
it exposes. Inside a layer the rule turns around: the barrel re-exports the file asking for it, so
going through it is a cycle, and a sibling is reached by name.

## Rule details

👎 Examples of **incorrect** code, from `src/authorizer/tokens/entities/token.entity.ts`:

```typescript
import { UsersService } from '@/authorizer/users/services/users.service' // names a file of another layer
import { SessionEntity } from '@/authorizer/tokens/entities' // its own barrel, which re-exports this file
import { SessionEntity } from './session.entity' // relative
import { build } from '@/authorizer/tokens/__tests__/factories' // a test file, from production code
import { buildRecord } from '@/authorizer/tokens/testing' // a testing folder, from production code
import { TokensService } from '@/authorizer/tokens/services/__mocks__/tokens.service' // a stand-in, from production code
import { buildGuardContext } from '@graphabits/nestjs/authorization/testing' // a package's testing entry
```

👍 Examples of **correct** code, from the same file:

```typescript
import { UsersService } from '@/authorizer/users/services' // another layer, through its barrel
import { SessionEntity } from '@/authorizer/tokens/entities/session.entity' // a sibling, by name
import { Injectable } from '@nestjs/common' // a package
import { Test } from '@nestjs/testing' // a package named after testing, not a testing entry of one
```

A file carrying no layer suffix, such as `tokens.module.ts`, reaches every layer through a barrel,
including the ones it sits beside. A barrel answers to none of this: re-exporting its siblings is
what it is for.

Production code reaches no testing folder, neither a local one nor the entry of a package that
ships one, such as `@graphabits/nestjs/database/testing`. A testing folder depends on what a
production install leaves out, so the import passes every check that installs the development
dependencies and the application fails at boot. Test code is exempt: a file in the test tree, a
spec anywhere, a file inside a testing folder, which is built out of other ones, and a file only a
development tool loads, such as a story, which the catalogue renders and the application never
imports. The mock folder is part of the test tree: a stand-in there may name any file a spec may,
and production code imports the module it replaces, never the stand-in. A test setup sits in the test tree or outside `src/`, which the rule does not read.

Direct imports of a file that shares the caller's suffix are allowed only inside the caller's own
layer directory. Matching on the suffix alone would let one `*.entity.ts` reach any other in the
project, including another module's, which is the hole the barrel exists to close.

## Options

Read from the `architecture` group of the options.

| Option                | Type                     | What it decides                                                           |
| --------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `suffixToFolder`      | `Record<string, string>` | which suffix names a layer, and the folder that holds it                  |
| `alias`               | `string`                 | the path alias that reaches the source root                               |
| `testFolder`          | `string`                 | the folder holding tests, which production code never imports from        |
| `testingFolder`       | `string`                 | the folder, local or a package subpath, holding what tests are built from |
| `developmentSuffixes` | `string[]`               | the suffixes of files only a development tool loads, read as test code    |
| `mockFolder`          | `string`                 | the folder beside a module holding its stand-in, part of the test tree    |

## Fixable

No. Which barrel a file should have named is a decision about what the layer exposes.

## When not to use it

A project whose folders are not layers, or one that reaches its own sources by relative path.
Cycles are a separate question, and `import-x/no-cycle` is the rule for them.
