# tsdoc/documented-function

Every method and every function a module declares carries a documentation comment, and the summary
says what the name cannot.

The visibility decides nothing. A public method is read at its call site, where the body is not in
view, and a private one is read by the next person to edit the class, who meets it the same way.
Whether a name "already says it" is a judgement two authors make differently, so presence is not
left to it. A summary that rewrites the name into a sentence is reported as if it were missing.

## Rule details

👎 Examples of **incorrect** code:

```typescript
export class UsersService {
  async findAllUsers(): Promise<PaginatedEntity<UserEntity>> {}

  /** Finds all users. */
  async findAllUsers(): Promise<PaginatedEntity<UserEntity>> {}

  private buildUserCacheKey(userId: string): string {}
}

const toKebabCase = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
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

  /**
   * The key one user is cached under, which a deletion drops along with the lookup by email.
   *
   * @param userId - The ID of the user.
   * @returns The key.
   */
  private buildUserCacheKey(userId: string): string {}

  /** @inheritDoc */
  override async onModuleInit(): Promise<void> {} // an override keeps the contract's text
}

/**
 * Writes a camel-case name the way a file name spells it, as `removeExtension` for `remove-extension`.
 *
 * @param name - The name in camel case.
 * @returns The name in kebab case.
 */
const toKebabCase = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

users.map(user => user.id) // a function written as an argument is not a declaration
```

## Options

| Option             | Type       | What it decides                                                                 |
| ------------------ | ---------- | ------------------------------------------------------------------------------- |
| `testFolder`       | `string`   | The folder the rule leaves alone, because a spec documents nothing for a caller |
| `frameworkSymbols` | `string[]` | The names a framework calls, which its own documentation describes              |

## Fixable

No. The text is the author's, and a generated summary would be the restatement the rule reports.

## When not to use it

A package whose surface is generated, or a codebase that documents at the module level rather than
per symbol.
