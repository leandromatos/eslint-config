# leandromatos/naming-forbidden-name

A name the options forbid whole, or a name carrying a word they forbid, is never declared.

Two lists, for two situations. `forbiddenNames` refuses a name as a whole: `data` alone. `forbiddenWords` refuses a
word of a name: `data` in `userData` and `UserData`, and not in `metadata`, since a word is a segment of a camel-case,
Pascal-case or snake-case name. A word refused as the `last` one is the suffix of the name: `userData` is refused and
`healthDataSharing`, where the word is part of a term of the domain, is not. Each entry carries the reason the report
reads.

The rule judges what the author chose: a variable, a parameter, a function, a class, a method or a property of a
class, an interface, a type alias, and a member of either. A key of an object literal is half of a contract the code
fills in, and so is the key of a type written inline for a parameter, so `context.report({ data })` spells `data`
because ESLint asked for it.

## Rule details

👎 Examples of **incorrect** code, with `data` a forbidden word:

```typescript
const userData = await fetchUser()

interface DeviceData {
  rawData: string
}
```

👍 Examples of **correct** code:

```typescript
const user = await fetchUser()

const metadata = readMetadata() // the letters inside another word are not the word

context.report({ node, messageId: 'forbiddenWord', data: { name } }) // a key of a contract
```

## Options

Read from the `naming` group of the options.

| Option           | Type              | What it decides                                                                        |
| ---------------- | ----------------- | -------------------------------------------------------------------------------------- |
| `forbiddenNames` | `ForbiddenName[]` | `{ name, because }`: the names no declaration carries whole                            |
| `forbiddenWords` | `ForbiddenWord[]` | `{ word, because, position? }`: the words no name carries, `anywhere` or as the `last` |

No tier forbids a name or a word. The `CONTROLLED_LANGUAGE` preset forbids `data` as the last word of a name, since it
says what a value is made of rather than what it is.

## Fixable

No. Only the author knows what the value holds, and that is what the new name says.

## When not to use it

A project that writes the names a contract imposes on its declarations, such as the fields of a payload it mirrors.
