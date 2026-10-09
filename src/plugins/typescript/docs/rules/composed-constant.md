# leandromatos/typescript-composed-constant

A value built from constants is built from constants alone: an object or a list that reads one writes nothing else in
place.

A project extends a default by reading it, `[...NEXTJS_ROOT_CONTEXTS, 'docs']`, and it reads only what has a name. An
object that reads some of its fields from constants and writes the others in place mixes two ways of saying a value, and
a reader cannot tell which fields are the ones to extend. The rule reads the files of constants the configuration points
it at, and tells three shapes apart:

| Shape       | What it is                              | What the rule asks                                    |
| ----------- | --------------------------------------- | ----------------------------------------------------- |
| literals    | `{ kind: 'e2e', client: 'supertest' }`  | nothing: it is a constant itself                      |
| extension   | `[...DEFAULT_FOLDERS, 'migrations']`    | its items may be written in place, but no list or map |
| composition | `{ access: SIGN_IN_TTL, refresh: ... }` | every value is read by name, since one already is     |

A value is read by name when it is a constant, a field of one, a call, a template that reads one, or a group built the
same way. A switch, `true` or `false`, an empty string, and an empty list or map hold nothing to name. A sentence, a
string with a space in it, is text the reader reads whole and the `text` rules judge, never a value a project extends,
so it stays where it is: a `title` beside the `type` it describes. A row of a table is not judged inside either: an
object a list holds, or a field of a map whose every field is an object written in place or a call that builds one,
which is a table keyed by name. Its fields are the row's own.

## Rule details

👎 Examples of **incorrect** code, in `src/config/oauth/constants/oauth.constant.ts`:

```typescript
export const OAUTH_TTL_IN_SECONDS = {
  accessToken: SIGN_IN_TTL_IN_SECONDS,
  authorizationCode: ms('10m') / 1000, // written in place beside a field read by name
}

export const NEXTJS_ARCHITECTURE = {
  ...DEFAULT_ARCHITECTURE,
  rootContexts: ['app', 'components'], // a list written in place, in an extension
}
```

👍 Examples of **correct** code:

```typescript
export const OAUTH_TTL_IN_SECONDS = {
  accessToken: SIGN_IN_TTL_IN_SECONDS,
  authorizationCode: AUTHORIZATION_CODE_TTL_IN_SECONDS,
}

export const NEXTJS_ARCHITECTURE = { ...DEFAULT_ARCHITECTURE, rootContexts: NEXTJS_ROOT_CONTEXTS }

export const NESTJS_VERB_PARTICIPLES = { ...DEFAULT_VERB_PARTICIPLES, createMock: 'mocked' } // an extension
```

## Options

None. Which files the rule reads is the configuration's to say, with `files`: every tier turns it on for
`**/*.constant.ts` alone, in the entry `leandromatos/constants`, from `DEFAULT_CONSTANT_FILES`.

## Fixable

No. The name of the new constant is the author's to choose.

## When not to use it

A file of constants whose objects are written once and read whole, never extended field by field.
