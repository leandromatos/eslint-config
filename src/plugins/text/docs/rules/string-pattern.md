# leandromatos/text-string-pattern

A string handed to a known call matches the pattern the options give for it.

Which call, which argument and which shape are all options, so the rule knows nothing about what the strings are for:
a project says that a log line never ends with a period and that an exception title always does, and the rule holds it
to that. It is where a decision about the voice of a product stops being prose and starts failing a build. A template
literal is judged by its text with each expression read as `{{value}}`, so a pattern can name where one sits.

## Rule details

👎 Examples of **incorrect** code, with a pattern that refuses a period at the end of a log line:

```typescript
logger.log('Notification sent.')
```

👍 Examples of **correct** code:

```typescript
logger.log(`Notification sent to user "${userId}"`)
```

## Options

Read from the `text` group of the options.

| Option           | Type              | What it decides                                                                                                                                                                         |
| ---------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stringPatterns` | `StringPattern[]` | `{ callee, property?, target?, must?, mustNot?, because }`: the call, the property it reads, the declaration it applies to, the shape the string keeps, and the reason the report reads |

A pattern names `must`, `mustNot` or both; one with neither asks nothing of a string and is refused where it is
written. No tier names a pattern. The `CONTROLLED_LANGUAGE` preset carries the shape of the logs, the exception titles
and the Swagger text of a NestJS service, in `CONTROLLED_LANGUAGE_STRING_PATTERNS`.

## Fixable

No. Rewriting a sentence is writing, and the message says what the shape is so the author can.

## When not to use it

A codebase with no conventions for its strings, or one whose strings are all translated elsewhere.
