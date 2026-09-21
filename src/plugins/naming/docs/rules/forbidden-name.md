# naming/forbidden-name

A name the conventions forbid is never declared.

These conventions forbid one word, `data`, which says what a value is made of rather than what it is. A
reader who meets it learns nothing, and the name survives every refactor that changes what the
value holds.

The rule judges what the author chose: a variable, a parameter, a function, a class, a property of
a class. A key of an object literal is half of a contract the code fills in, so
`context.report({ data })` spells `data` because ESLint asked for it.

## Rule details

👎 Examples of **incorrect** code:

```typescript
const data = await fetchDevices()

function render(data: Device[]) {}
```

👍 Examples of **correct** code:

```typescript
const devices = await fetchDevices()

function render(devices: Device[]) {}

context.report({ node, messageId: 'forbidden', data: { name } })
```

## Options

| Option           | Type       | What it decides                                               |
| ---------------- | ---------- | ------------------------------------------------------------- |
| `forbiddenNames` | `string[]` | The names no declaration carries, whatever the value it holds |

## Fixable

No. Only the author knows what the value holds, and that is what the new name has to say.

## When not to use it

A project that has to write a name a contract imposes on a declaration passes a list of its own,
or an empty one.
