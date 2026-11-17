# leandromatos/architecture-import-boundaries

A file imports the file that declares what it needs, and never a barrel: a directory whose index file re-exports.

A barrel loads every file it re-exports, so one import through `@/users/services` loads every service of the
directory, and every file those services import. Each test file and each process boot pays for that whole graph. An
import of the declaring file loads that file alone, so a test loads what it reads and a process boot loads what it runs.

## Rule details

👎 Examples of **incorrect** code, from `src/accounts/tokens/entities/token.entity.ts`:

```typescript
import { UsersService } from '@/accounts/users/services' // a barrel
export * from '@/accounts/users/services' // a barrel, passed on
import { UsersService } from '@/accounts/users/services/index' // a barrel, named by its index file
import { x } from './session.entity' // relative
import { buildToken } from '@/accounts/tokens/__tests__/factories' // the test tree, from production code
import { buildRecord } from '@/database/testing' // a testing folder, from production code
import { buildPaginatedEntity } from '@acme/nestjs/database/testing' // the testing entrypoint of a package
```

👍 Examples of **correct** code, from the same file:

```typescript
import { UsersService } from '@/accounts/users/services/users.service' // the declaring file, of any layer
import { PLAN_LIMIT } from '@/accounts/plans' // src/accounts/plans.ts, a file beside the directory of that name
import { SESSION_TTL } from '@/accounts/sessions' // a directory whose index file declares code and re-exports nothing
import { Injectable } from '@nestjs/common' // a package
import { Test } from '@nestjs/testing' // a package named after testing, not the testing entrypoint of one
```

The messages, one per finding, where `{{specifier}}` is the specifier as the code writes it:

```plaintext
"{{specifier}}" names a barrel. Import the file that declares what you need, so the import loads that file alone.
"{{specifier}}" is relative. Reach it by the alias, so the path reads the same from anywhere.
"{{specifier}}" is a test file, and production code is never part of a test import graph.
"{{specifier}}" is a testing entrypoint, which depends on what a production install leaves out. Import a runtime entrypoint.
```

A specifier is a barrel when the alias names a directory whose index file holds at least one re-export, as
[`architecture-re-export-only-at-entrypoint`](re-export-only-at-entrypoint.md) defines one. The `index.ts` is judged, or
the `index.tsx` when no `index.ts` sits there. The rule reads the index file again at each run. A specifier that names
the index file itself, such as `@/users/services/index` or `@/users/services/index.js`, is judged the same way;
`@/users/services/index.page` names another file. A directory whose index file re-exports nothing loads that file alone,
so the rule allows it. A package is not judged: its entrypoint is what it publishes.

A directory whose index file the package publishes, such as `src/testing/index.ts` behind `"./testing"` in the `exports`
of `package.json`, is an entrypoint rather than a barrel, so the rule allows an import of it.
[`architecture-re-export-only-at-entrypoint`](re-export-only-at-entrypoint.md) reads a published entrypoint the same
way. Under a `./*` target every directory is a published entrypoint, so the rule reports no barrel import there. The
rule resolves only the `alias` prefix to the source root, so it checks no import through another path alias for a
barrel.

An index file that re-exports answers to none of this, because passing its siblings on is what it does. Whether it may
is the call of [`architecture-re-export-only-at-entrypoint`](re-export-only-at-entrypoint.md). Any other index file is
judged like any other file. A published entrypoint, as that rule reads one, keeps its re-export statements, such as
`export * from './cache/keyv/keyv'` in `src/testing.ts`. The rule judges its imports like those of any other file.

Production code reaches no testing folder, neither a local one nor the entrypoint of a package that ships one. A testing
folder depends on what a production install leaves out, so the import passes every check that installs the
development dependencies and the application fails at process boot. Test code is exempt: a file in the test tree, a spec
anywhere, a file inside a testing folder, and a file only a development tool loads, such as a story. The mock folder
is part of the test tree: a stand-in there may name any file a spec may, and production code imports the module it
replaces, never the stand-in.

## Options

Read from the `architecture` group of the options.

| Option                | Type                     | What it decides                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `alias`               | `string`                 | the prefix an import names the source root with                                     |
| `suffixToFolder`      | `Record<string, string>` | the suffix of a spec, which marks a file outside the test tree as test code         |
| `testFolder`          | `string`                 | the folder holding tests, which production code never imports from                  |
| `testingFolder`       | `string`                 | the folder, local or the entrypoint of a package, holding what tests are built from |
| `developmentSuffixes` | `string[]`               | the suffixes of files only a development tool loads, read as test code              |
| `mockFolder`          | `string`                 | the folder beside a module holding its stand-in, part of the test tree              |

## Fixable

No. The rule reports a barrel import and writes no fix. Import each name from the file that declares it.

## When not to use it

A project that reaches its own sources by relative path. Cycles are a separate question, and `import-x/no-cycle` is
the rule for them.
