# leandromatos/tsdoc-documented-type

Every class, interface and type alias a module declares carries a documentation comment, and the summary says what the
name cannot.

A type is read wherever it is named, and the editor shows its comment there. An alias a type utility derives is no
exception: its right-hand side tells how the type is built, and the comment tells what it is for. A summary that
rewrites the name into a sentence is reported as if it were missing.

## Rule details

👎 Examples of **incorrect** code:

```typescript
export class UsersService {}

interface UserCriteria {
  limit: number
}

export type TokenInsertAttributes = InferInsertModel<typeof TokensTable>

/** The user entity. */
export class UserEntity {}
```

👍 Examples of **correct** code:

```typescript
/** Reads the users, behind the cache, and invalidates it on every write. */
@Injectable()
export class UsersService {}

/** What a page of users is cut by, newest first. */
interface UserCriteria {
  limit: number
}

/** The row a query writes into the tokens table, with the columns the database fills left out. */
export type TokenInsertAttributes = InferInsertModel<typeof TokensTable>

/** One of the purposes in {@link TokenType}. */
export type TokenType = (typeof TokenType)[keyof typeof TokenType]
```

A class bound to a variable is declared too, and so is a type inside a `declare module` or a `declare global`. The
comment of a decorated class sits above its first decorator.

## Options

None. A spec and a name a framework reads are documented like any other type.

## Fixable

No. The text is the author's, and a generated summary would be the restatement the rule reports.

## When not to use it

A package whose types are generated, such as a client built from an OpenAPI document.
