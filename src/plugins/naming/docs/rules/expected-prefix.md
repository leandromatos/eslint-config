# naming/expected-prefix

A value an assertion compares against is named `expected*`.

The test then reads as what it checks: `expect(result).toEqual(expectedUserEntity)`. A literal or a
call in that place needs no name, and a shared constant is not what one assertion expects.

## Rule details

👎 Examples of **incorrect** code:

```typescript
const builtUser = usersFactory.build()

expect(result).toEqual(builtUser)
```

👍 Examples of **correct** code:

```typescript
const expectedUser = usersFactory.build()

expect(result).toEqual(expectedUser)
expect(result).toEqual({ id: 'a-user-id' }) // a literal needs no name
expect(result).toEqual(DEFAULT_PAGE_SIZE) // a shared constant keeps its name
```

## Options

| Option              | Type                     | What it decides                                                                 |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| `assertionMatchers` | `string[]`               | The matchers whose argument is what the assertion compares against              |
| `verbParticiples`   | `Record<string, string>` | The participles a name may carry, which the fix strips before adding the prefix |
| `testFolder`        | `string`                 | The folder the rule judges                                                      |

## Fixable

Yes. The fix strips the participle and renames the declaration and its references.

## When not to use it

Outside a test, or in a suite that names the comparison value after the scenario rather than after
its role.
