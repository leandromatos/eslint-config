# testing/e2e-over-http

A spec of the end-to-end kind sends requests: it imports the HTTP client the options name.

A spec in that folder that takes a provider out of the module and calls it exercises no route. It
is a unit test that borrowed the database, and it passes while the route it is supposed to cover
is broken.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// src/users/__tests__/e2e/users.spec.ts
const usersRepository = testingModule.get<UsersRepository>(UsersRepository)

const user = await usersRepository.createUser(createUserInput)
```

👍 Examples of **correct** code:

```typescript
// src/users/__tests__/e2e/users.spec.ts
import request from 'supertest'

const response = await request(app).post('/v1/users').send(createUserBody)

expect(response.status).toBe(HttpStatus.CREATED)
```

## Options

| Option           | Type                     | What it decides                                                                                |
| ---------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `httpTest`       | `HttpTest`               | `{ kind, client }`: the test kind that goes through HTTP and the module it sends requests with |
| `testFolder`     | `string`                 | The tree the rule judges                                                                       |
| `suffixToFolder` | `Record<string, string>` | Which files in that tree are specs                                                             |

## Fixable

No. Turning a provider call into a request is rewriting the test.

## When not to use it

A codebase whose end-to-end kind drives something other than HTTP, such as a CLI or a queue.
