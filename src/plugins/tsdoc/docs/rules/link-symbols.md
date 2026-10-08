# tsdoc/link-symbols

A name a reader could jump to is written so the tooling lets them: a symbol in scope is
`{@link Symbol}`, and code font is for what is not a symbol.

Written both ways, the same name reads as two things. A link whose target resolves to nothing is a
promise the page cannot keep, and a symbol that is not in scope is named in prose. Importing one
only to link it is an unused import.

A code span counts as a symbol only when it holds one name whole, between single backticks, and
that name is something a page documents: a class, an interface, a type, an enum, a function (a
`const` holding one included), a method of the enclosing class, or a name imported by name. A
variable that holds a value, a parameter, a property, and a default or namespace import name a
value, a key or a package, so `currentColor`, `tailwindcss` or `key` in code font stays code font
even when a binding shares the name. A span of more than one backtick holds code, and a name inside
it is part of that code.

TSDoc reads ten names as selectors in a reference: `class`, `constructor`, `enum`, `function`,
`instance`, `interface`, `namespace`, `static`, `type` and `variable`. A link names one of them in
quotes, and a member of the class the comment sits in is qualified by that class:
`{@link Activity."type"}`. Unquoted, `{@link type}` fails `tsdoc/syntax`. A member of a class with
no name has no qualified form, so it stays in code font.

## Rule details

👎 Examples of **incorrect** code:

```typescript
/** The storage the flow state expires in, behind `OAuthService`. */

/** Kept until {@link OAuthCasher} forgets it. */

/** Reads {@link type}, the kind of the activity. */
```

👍 Examples of **correct** code:

```typescript
/** The storage the flow state expires in, behind {@link OAuthService}. */

/** Kept under `oauth:session:{id}`, which is a key rather than a symbol. */

/** Answered by the service that speaks the provider's contract. */

/** Reads {@link Activity."type"}, the kind of the activity. */
```

## Options

None.

## Fixable

Yes for a selector a link writes unquoted, which goes in quotes and, as a member of the enclosing
class, takes that class as its owner. A symbol in code font is reported with a suggestion, never a
fix: a name can coincide with a symbol, and only the author knows which one the comment meant. A link that resolves to nothing is reported
and not fixed: whether the target was renamed or never existed is not the rule's to guess.

## When not to use it

A codebase that generates no documentation and treats every name as code font, or one where most
referenced symbols live outside the file's scope.
