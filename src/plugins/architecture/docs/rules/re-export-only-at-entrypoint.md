# leandromatos/architecture-re-export-only-at-entrypoint

Only a published entrypoint re-exports.

A re-export is one statement, judged on its own:

- `export * from`, `export * as name from`, `export { … } from`, `export {} from`, or `export import name = require(…)`,
  of values: `export {} from` names nothing and still loads the module;
- `export { name }`, `export default name` or `export = name`, where `name` is a value an import of the same file brings
  in, by `import` or by `import name = require(…)`.

An `export type` passes on no value, and neither does an `export { type … } from` whose names are all types, so neither
is a re-export, as Biome's `noBarrelFile` reads them. A `.d.ts` file loads nothing, so the rule leaves it alone. Nothing
else counts: `import { a } from './a'` then `export const alsoA = a` declares a value of the file's own.

A type passed on without `type`, such as `import { UserShape } from './user.entity'` then `export { UserShape }`, counts
as a re-export, since the rule reads no types. Write `export type`.

A re-export loads the file it names. An import of a file that re-exports loads every file it passes on, read or not,
so a test file and a process boot pay for files they never use. Inside a project, code imports the file that declares
a name, which [`architecture-import-boundaries`](import-boundaries.md) holds.

## Rule details

Every re-export statement is reported, in an index file or in any other file, unless the file is a published
entrypoint:

```plaintext
This statement re-exports another file, and only a published entrypoint re-exports. Remove it, and import the declaring file in each file that uses the name.
```

A re-export of a package, a specifier that is neither relative nor the alias, has no declaring file of the project. The
same holds for `export { name }`, `export default name` or `export = name` of a name an import of a package binds:

```plaintext
This statement re-exports a package, and only a published entrypoint re-exports. Remove it, and import the package in each file that uses the name.
```

👎 Examples of **incorrect** code, from `src/users/services/index.ts`:

```typescript
export * from './users.service'
export { RolesService } from './roles.service'
import { AuditService } from './audit.service'
export { AuditService }
```

👍 Examples of **correct** code, from the same file:

```typescript
export type { UsersServiceOptions } from '@/users/services/users.service'
export const USERS_PAGE_SIZE = 20
```

## Published entrypoints

A published entrypoint may re-export, since a consumer imports it by the package name:

- the index file at the source root, `src/index.ts`, which is always left alone: a package keeps its main entrypoint
  there, and the rule does not read the manifest to confirm it;
- a source file a target of the `exports` of the `package.json` of the package is built from, whatever its name.

The rule reads `exports` so a project names no entrypoint twice. `exports` may be a string, a list, or an object of
keys and conditions, nested at any depth. Only targets name files, so a key alone publishes nothing:
`"./legacy": "./dist/users/index.js"` publishes `src/users/index.ts`, and not `src/legacy/index.ts`.

- A target publishes the source file it is built from, and a target that names a source file, such as
  `"./src/ui/index.tsx"`, publishes that file. The leading folders of the target are build folders. The shortest run of
  them that names a file or a folder under `src/` wins: `"./dist/esm/cache/index.js"` publishes `src/cache/index.ts`
  when `src/esm/cache/index.ts` does not exist, and `"./testing": "./dist/testing.js"` publishes `src/testing.ts`. A
  target named after a directory also publishes its index file, as a bundler such as tsup or unbuild names its build:
  `"./testing": "./dist/testing.js"` publishes `src/testing/index.ts` when `src/testing.ts` does not exist. A target
  that names no source file, such as `"./dist/tokens/tokens.css"`, publishes nothing. The rule does not read a key set
  to `null`: it publishes nothing and keeps nothing unpublished.
- Under a key that holds a `*`, a `*` of the target stands for any text, slashes included, as Node reads it. Under any
  other key, a `*` is a plain character. `"./schemas/*": "./dist/schemas/*/index.js"`
  publishes the index file of every directory under `src/schemas/`, at any depth, and not `src/schemas/index.ts`.
  `"./*": "./dist/*.js"` publishes every file of the sources, since a subpath such as `./cache/cache.util` resolves to
  its build.

Every other file is reported for its re-exports, an index file above or below a published one included.

The rule reads the targets again whenever `package.json` changes. It checks the linted file against them at each run,
so a running editor sees a new file under a `*` target. A manifest that does not parse publishes nothing.

## Options

Read from the `architecture` group of the options.

| Option  | Type     | What it decides                                                                                        |
| ------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `alias` | `string` | the prefix an import names the source root with; any other specifier that is not relative is a package |

## Fixable

No. Removing a re-export changes every import that reaches a name through it. Import each name from its declaring
file, then delete the re-export.

## When not to use it

A codebase that publishes every directory as an entrypoint, or one that has decided its re-exports are worth the load
time.
