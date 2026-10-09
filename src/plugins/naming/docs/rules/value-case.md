# leandromatos/naming-value-case

A string value keeps the casing the name it is declared under promises.

A queue name is a key segment of the store it lives in, and a job name is a field of a hash; which is which is said by
the name, so the rule reads the declaration and judges the literal it holds. An assertion on the literal, `as const` or
`satisfies`, leaves the literal to be judged.

## Rule details

👎 Examples of **incorrect** code, with `QueueName` on `camelCase` and `JobNames` on `kebab-case`, deep:

```typescript
export const sessionsCleanupQueueName = 'sessions-cleanup'
export const passwordJobNames = { recoverPassword: 'recoverPassword' }
```

👍 Examples of **correct** code:

```typescript
export const sessionsCleanupQueueName = 'sessionsCleanup' satisfies QueueName
export const passwordJobNames = { recoverPassword: 'recover-password' }
```

## Options

Read from the `naming` group of the options.

| Option       | Type          | What it decides                                                                                                            |
| ------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `valueCases` | `ValueCase[]` | `{ endsWith, casing, deep }`: the name ending that governs, its casing, and whether the values of an object are judged too |

The `nestjs` tier names the three a NestJS API writes, in `NESTJS_VALUE_CASES`: `QueueName` and `namespace` in
`camelCase`, `JobName` in `kebab-case`, deep.

## Fixable

No. Recasing a value a store already holds changes what the code reads back, so the fix is a decision rather than a
transformation.

## When not to use it

A codebase whose keys and names carry no casing contract.
