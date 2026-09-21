# typescript/const-assertion-pair

A closed set of values is an object `as const` and the type derived from it, under one name, in the file the types live in.

## Rule details

These conventions allow no `enum`. An enum is the one TypeScript construct that emits runtime code with no JavaScript counterpart: Node's own type stripping cannot run it, a single-file transpiler cannot inline it, and a `const enum` inlined from one version of a dependency runs against another at runtime. The handbook says as much: "In modern TypeScript, you may not need an enum when an object with `as const` could suffice".

What replaces it is a pair. The object is the value, the alias is the union of what it holds, and they share a name, so `OAuthScope.EMAIL` is read where a value is read and `OAuthScope` where a type is. Half a pair is what this rule reports: a vocabulary nothing can be typed by, a type nothing can be read from, or a union written by hand, which stops following the object the moment a member is added.

A name in Pascal case is what declares the intent. A constant value shouts (`EXAMPLE_IDS`), and a declaration read as a type is written as one (`ExampleId`), so the rule judges the second and leaves the first alone. An object of functions is a helper and a record of a handful of fields is a value; neither is a vocabulary, and neither is judged.

### ❌ Incorrect

```typescript
// The vocabulary nothing can be typed by.
export const OAuthScope = {
  OPENID: 'openid',
  EMAIL: 'email',
} as const
```

```typescript
// The union that stops following the object.
export const OAuthScope = {
  OPENID: 'openid',
  EMAIL: 'email',
} as const

export type OAuthScope = 'openid' | 'email'
```

```typescript
// The enum this pattern replaces.
export enum OAuthScope {
  OPENID = 'openid',
}
```

### ✅ Correct

```typescript
export const OAuthScope = {
  OPENID: 'openid',
  EMAIL: 'email',
} as const

export type OAuthScope = (typeof OAuthScope)[keyof typeof OAuthScope]
```

## Options

| Option       | Type     | Description                                                                              |
| ------------ | -------- | ---------------------------------------------------------------------------------------- |
| `typeSuffix` | `string` | The suffix of the files a vocabulary is declared in, such as `type`. Empty turns it off. |

## Fixable

Yes, for the two halves the file can answer on its own: the missing alias is added after the value, and a hand-written union is replaced by the derivation. Where the value is missing, or the pair sits in the wrong file, the fix is a decision and the rule reports without touching anything.

## When not to use it

A project that ships `enum` on purpose, because a dependency's public API declares one and the code mirrors it.
