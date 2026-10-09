# leandromatos/testing-e2e-over-http

A spec of the end-to-end kind sends requests: it imports the HTTP client the options name.

A spec in that folder that takes a provider out of the application and calls it exercises no route. It is a unit test
that borrowed the database, and it passes while the route it covers is broken.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// src/users/__tests__/e2e/users.spec.ts
const usersRepository = application.get(UsersRepository)

const user = await usersRepository.createUser(createUserInput)
```

👍 Examples of **correct** code:

```typescript
// src/users/__tests__/e2e/users.spec.ts
import request from 'supertest'

const response = await request(server).post('/v1/users').send(createUserBody)

expect(response.status).toBe(201)
```

## Options

Read from the `testing` group of the options, which the tiers fill from `architecture` and `testing`.

| Option           | Type                     | What it decides                                                                            |
| ---------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `httpTest`       | `HttpTest`               | `{ kind, client }`: the kind that goes through HTTP, and the module it sends requests with |
| `testFolder`     | `string`                 | the tree the rule judges                                                                   |
| `suffixToFolder` | `Record<string, string>` | which files in that tree are specs                                                         |

The `nestjs` tier names `supertest` for the `e2e` kind and `nextjs` names `@playwright/test`; `strict` and `expo` name
none, and the rule judges nothing without one.

## Fixable

No. Turning a provider call into a request is rewriting the test.

## When not to use it

A codebase whose end-to-end kind drives something other than HTTP, such as a CLI or a queue.
