# leandromatos/testing-describes-source

Every outermost `describe` of a spec that mirrors a source names something that source exports.

The name is what the runner prints, so a spec named after something else reports on it: a failure in
`users.service.spec.ts` that says `UserProfileService` sends the reader to the wrong file. The source is read written
as a module or as a component, and where no source sits at the mirrored path, the name of the file stands for it:
`missing.service.spec.ts` takes `MissingService` or `Missing`.

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

// src/requests/__tests__/unit/utils/read-request-origin.util.spec.ts
describe('readRequestOrigin', () => {})

// src/accounts/__tests__/e2e/sign-in.spec.ts
describe('Sign in (e2e)', () => {}) // a kind that mirrors nothing is left alone
```

## Options

Read from the `testing` group of the options, which the tiers fill from `architecture`.

| Option               | Type                     | What it decides                              |
| -------------------- | ------------------------ | -------------------------------------------- |
| `testFolder`         | `string`                 | the tree the rule judges                     |
| `mirroringTestKinds` | `string[]`               | the kinds whose specs mirror one source      |
| `suffixToFolder`     | `Record<string, string>` | how a spec path is walked back to its source |

## Fixable

No. Which export the spec is about is what the author declares.

## When not to use it

A suite whose describes are written as sentences rather than as names.
