# naming/value-case

A string value keeps the casing the name it is declared under promises.

A queue name is a Redis key segment and a job name is a hash field; which is which is said by the
name, so the rule reads the declaration and judges the literal it holds.

## Rule details

👎 Examples of **incorrect** code:

```typescript
export const OAuthSessionsCleanupQueueName = 'oauth-sessions-cleanup' as const
export const CredentialPasswordJobName = { RECOVER_PASSWORD: 'recoverPassword' } as const
```

👍 Examples of **correct** code:

```typescript
export const OAuthSessionsCleanupQueueName = 'oauthSessionsCleanup' as const
export const CredentialPasswordJobName = { RECOVER_PASSWORD: 'recover-password' } as const
```

## Options

| Option       | Type          | What it decides                                                                                                                                  |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `valueCases` | `ValueCase[]` | `{ suffix, casing, deep }`: the name suffix that governs, the casing its value keeps, and whether the values of an object literal are judged too |

## Fixable

No. Recasing a value that a store already holds changes what the code reads back, so the fix is a
decision rather than a transformation.

## When not to use it

A codebase whose keys and names carry no casing contract.
