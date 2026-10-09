# leandromatos/typescript-const-assertion-pair

A closed set of values is an object `as const` and the type derived from it, under one name, in the file the types
live in.

An `enum` is the one construct of TypeScript that emits runtime code with no JavaScript counterpart: the type stripping
of Node cannot run it, a single-file transpiler cannot inline it, and a `const enum` inlined from one version of a
dependency runs against another. The handbook says as much: _"In modern TypeScript, you may not need an enum when an
object with `as const` could suffice"_ ([Enums](https://www.typescriptlang.org/docs/handbook/enums.html#objects-vs-enums)).
`recommended` refuses the `enum`, and this rule holds the pair that replaces it.

The object is the value, the alias is the union of what it holds, and they share a name, so `OAuthScope.EMAIL` is read
where a value is read and `OAuthScope` where a type is. Half a pair is what this rule reports: a vocabulary nothing can
be typed by, a type nothing can be read from, or a union written by hand, which stops following the object the moment
a member is added.

A name in Pascal case is what declares the intent. A constant value shouts (`ROLE_NAMES`), and a declaration read as a
type is written as one (`RoleName`), so the rule judges the second and leaves the first alone. An object of functions
is a helper and a record of fields is a value; neither is a vocabulary, and neither is judged.

## Rule details

👎 Examples of **incorrect** code:

```typescript
// The vocabulary nothing can be typed by.
export const OAuthScope = {
  OPENID: 'openid',
  EMAIL: 'email',
} as const

// The union that stops following the object.
export type OAuthScope = 'openid' | 'email'
```

👍 Examples of **correct** code, in `src/oauth/types/oauth.type.ts`:

```typescript
export const OAuthScope = {
  OPENID: 'openid',
  EMAIL: 'email',
} as const

export type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]
```

## Options

Read from the `typescript` group of the options.

| Option       | Type     | What it decides                                                                         |
| ------------ | -------- | --------------------------------------------------------------------------------------- |
| `typeSuffix` | `string` | the suffix of the files a vocabulary is declared in, such as `type`; empty turns it off |

## Fixable

Yes, for the two halves the file can answer on its own: the missing alias is added after the value, exported when the
value is, and a union written by hand is replaced by the derivation. Where the value is missing, or the pair sits in
the wrong file, the fix is a decision and the rule reports without touching anything.

## When not to use it

A project that mirrors an `enum` the public API of a dependency declares.
