# tsdoc/public-surface

Every public method and every exported function carries a documentation comment, and the summary
says what the name cannot.

A public method is read at its call site, where the body is not in view; an exported symbol ships
as a blank in whatever the documentation is generated from. Whether a name "already says it" is a
judgement two authors make differently, so presence is not left to it. A summary that rewrites
the name into a sentence is reported as if it were missing.

## Rule details

👎 Examples of **incorrect** code:

```typescript
export class UsersService {
  async findAllUsers(): Promise<PaginatedEntity<UserEntity>> {}

  /** Finds all users. */
  async findAllUsers(): Promise<PaginatedEntity<UserEntity>> {}
}
```

👍 Examples of **correct** code:

```typescript
export class UsersService {
  /**
   * Answers with a page of users, most recent first.
   *
   * The listing is never cached: a page depends on what the query asked for, and a cached page
   * would answer a query nobody made.
   */
  async findAllUsers(): Promise<PaginatedEntity<UserEntity>> {}

  /** @inheritDoc */
  override async onModuleInit(): Promise<void> {} // an override keeps the contract's text
}
```

## Options

| Option       | Type     | What it decides                                                                 |
| ------------ | -------- | ------------------------------------------------------------------------------- |
| `testFolder` | `string` | The folder the rule leaves alone, because a spec documents nothing for a caller |

## Fixable

No. The text is the author's, and a generated summary would be the restatement the rule reports.

## When not to use it

A package whose public surface is generated, or a codebase that documents at the module level
rather than per symbol.
