# leandromatos/testing-typed-fixture

A fixture built as an object literal and handed to the subject carries the type the subject declares for it.

An anonymous literal drifts in silence when the contract changes: the field that was renamed is still there, the test
still passes, and nothing says the shape is no longer the one the code takes. The annotation makes it a compile error
instead.

## Rule details

👎 Examples of **incorrect** code:

```typescript
const body = { name: 'Ada', email: 'ada@example.com' }

await usersService.createUser(body)
```

👍 Examples of **correct** code:

```typescript
const createUserBody: CreateUserBody = { name: 'Ada', email: 'ada@example.com' }

await usersService.createUser(createUserBody)
```

## Options

Read from the `testing` group of the options, which the tiers fill from `architecture`.

| Option       | Type     | What it decides                                             |
| ------------ | -------- | ----------------------------------------------------------- |
| `testFolder` | `string` | the tree the rule judges                                    |
| `alias`      | `string` | the prefix the import the fix writes names the sources with |

## Fixable

Yes. The fix annotates the declaration with the type the callee declares, and imports that type from the barrel of the
directory that declares it: `@/users/dtos` for a type under `src/users/dtos/`. A type at the root of the sources, or
outside them, has no barrel the alias reaches, so the fix stops at the report.

## When not to use it

A suite whose fixtures are built by factories everywhere, or one testing code with no named parameter types.
