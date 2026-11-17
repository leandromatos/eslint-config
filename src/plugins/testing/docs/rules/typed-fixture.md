# leandromatos/testing-typed-fixture

A fixture built as an object literal and handed to the subject carries the type the subject declares for it.

An anonymous literal drifts in silence when the contract changes: the field that was renamed is still there, the test
still passes, and nothing says the shape is no longer the one the code takes. The annotation makes it a compile error
instead.

## Rule details

The examples call this subject:

```typescript
interface CreateUserInput {
  name: string
}
declare function createUser(input: CreateUserInput): void
```

👎 Examples of **incorrect** code, from `src/users/__tests__/unit/user.service.spec.ts`:

```typescript
const input = { name: 'a' }
createUser(input)
```

```plaintext
"input" is an anonymous literal handed to "createUser", which declares it as CreateUserInput. Annotate it.
```

The report writes the type as the type-checker does, a generic with its argument included.

👍 Examples of **correct** code, from the same file:

```typescript
const input: CreateUserInput = { name: 'a' }
createUser(input)

createUser({ name: 'a' }) // a literal written in the call is checked against the parameter already
```

A rest parameter takes a list of the fixtures, so a fixture handed to one is not judged. Neither is a fixture handed
to a callee whose parameter is typed as a literal, which declares no name to annotate with.

## Options

Read from the `testing` group of the options, which the tiers fill from `architecture`.

| Option       | Type     | What it decides          |
| ------------ | -------- | ------------------------ |
| `testFolder` | `string` | the tree the rule judges |

## Fixable

No. The rule reports the fixture and the type the callee declares for it, and writes no fix. Annotate the fixture with
that type, and import it from the file that declares it.

## When not to use it

A suite whose fixtures are built by factories everywhere, or one testing code with no named parameter types.
