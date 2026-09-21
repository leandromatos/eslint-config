# testing/describes-source

Every outermost `describe` of a spec that mirrors a source names something that source exports.

The name is what the runner prints, so a spec named after something else reports on it: a failure
in `users.service.spec.ts` that says `UserProfileService` sends the reader to the wrong file. Where
the source cannot be read, the rule says nothing.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// src/users/__tests__/unit/services/users.service.spec.ts
describe('UsersServices', () => {}) // no such export
describe('user service', () => {}) // not a name at all
```

👍 Examples of **correct** code:

```typescript
// src/users/__tests__/unit/services/users.service.spec.ts
describe('UsersService', () => {})

// src/observability/__tests__/unit/utils/read-request-origin.util.spec.ts
describe('readRequestOrigin', () => {})

// src/oauth/__tests__/e2e/oauth-authorization.spec.ts
describe('OAuth authorization (e2e)', () => {}) // a kind that mirrors nothing is left alone
```

## Options

| Option               | Type                     | What it decides                              |
| -------------------- | ------------------------ | -------------------------------------------- |
| `testFolder`         | `string`                 | The tree the rule judges                     |
| `mirroringTestKinds` | `string[]`               | The kinds whose specs mirror one source      |
| `suffixToFolder`     | `Record<string, string>` | How a spec path is walked back to its source |

## Fixable

No. Which export the spec is about is what the author is declaring.

## When not to use it

A suite whose describes are written as sentences rather than as names.
