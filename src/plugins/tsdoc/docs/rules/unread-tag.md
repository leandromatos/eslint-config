# leandromatos/tsdoc-unread-tag

A comment carries no tag that nothing reads: `@override` always, and a release tag when the project runs no tool that
reads one.

A tag that restates a keyword, or that speaks to a tool the project does not run, looks like contract and is noise.
`@override` repeats the `override` keyword, which the compiler reads. `@public`, `@internal`, `@alpha` and `@beta` are
read by TypeDoc and API Extractor to trim what a package publishes, and without one of them the tag drifts from the
entry point that decides.

## Rule details

👎 Examples of **incorrect** code:

```typescript
class UsersRepository extends Repository {
  /**
   * Reads one user.
   *
   * @override
   */
  override findOneUser(userId: string): Promise<UserEntity> {}
}

/**
 * The ID a route carries.
 *
 * @internal
 */
export type UserKey = string
```

👍 Examples of **correct** code:

```typescript
class UsersRepository extends Repository {
  /** {@inheritDoc Repository.findOneUser} */
  override findOneUser(userId: string): Promise<UserEntity> {}
}

/** The ID a route carries, never the email. */
export type UserKey = string
```

## Options

Read from the `tsdoc` group of the options.

| Option             | Type      | What it decides                                                                |
| ------------------ | --------- | ------------------------------------------------------------------------------ |
| `readsReleaseTags` | `boolean` | whether the project runs TypeDoc or API Extractor, which read the release tags |

It is `false` in every tier. A project that runs one of the two passes `tsdoc: { readsReleaseTags: true }`.

## Fixable

No.

## When not to use it

A package whose published reference is trimmed by its release tags, which turns `readsReleaseTags` on rather than the
rule off.
