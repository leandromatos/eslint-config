# text/string-pattern

A string handed to a known call looks the way the options say.

Which call, which argument and which shape are all options, so the rule knows nothing about what
the strings are for: a project says that a log line never ends with a period and that an exception
title always does, and the rule holds it to that. It is where a tone-and-voice decision stops being
prose and starts failing a build.

## Rule details

👎 Examples of **incorrect** code:

```typescript
this.logger.log('Password reset notification sent.') // a log line carries no period
throw new NotFoundException({ title: 'User was not found' }) // a not-found title is "{Resource} not found."
ApiOperation({ summary: 'Find all activities' }) // a read is "Retrieve"
ApiProperty({ description: 'The user id' }) // an ID is "The unique identifier of the {resource}."
```

👍 Examples of **correct** code:

```typescript
this.logger.log(`Password reset notification sent for user "${userEntity.id}"`)
throw new NotFoundException({ title: 'User not found.' })
ApiOperation({ summary: 'Retrieve all activities' })
ApiProperty({ description: 'The unique identifier of the user.' })
```

## Options

| Option           | Type              | What it decides                                                                                                                                                                                      |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stringPatterns` | `StringPattern[]` | `{ callee, property?, target?, must?, mustNot?, because }`: the call, the argument or property it reads, the declaration it applies to, the shape the string keeps, and what to say when it does not |

## Fixable

No. Rewriting a sentence is writing, and the message says what the shape is so the author can.

## When not to use it

A codebase with no text conventions, or one whose strings are all translated elsewhere.
