# leandromatos/naming-result-by-verb

A variable holding what a call produced opens with the participle of the verb that produced it.

The input and the output of a producing verb are two values sharing a scope, and often a type; the participle tells
them apart and says which one is the result. A verb that only looks something up produces nothing new, so nothing
marks what it answers.

## Rule details

👎 Examples of **incorrect** code:

```typescript
const token = await this.credentialTokensRepository.createToken(input)
const password = await hashPassword(password, saltOrRounds)
```

👍 Examples of **correct** code:

```typescript
const activityEntity = this.activitiesTransformer.toActivityEntity(activity) // a conversion names its result freely
const createdToken = await this.credentialTokensRepository.createToken(input)
const hashedPassword = await hashPassword(password, saltOrRounds)
const user = await this.usersService.findOneUser(params) // find produces nothing new
export const activityEntity = build() // an export is named by its file
const { session } = await this.load() // a destructured name is the key of what it takes apart
```

## Options

Read from the `naming` group of the options.

| Option            | Type                     | What it decides                                                                                                |
| ----------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `verbParticiples` | `Record<string, string>` | the producing verbs and the participle each one's result opens with: `create` as `created`, `hash` as `hashed` |
| `roleNames`       | `string[]`               | names a test gives by role, which the rule leaves alone                                                        |
| `testFolder`      | `string`                 | the folder where the role names apply                                                                          |

## Fixable

Yes, when the new name is free in scope; the fix renames the declaration and its references.

## When not to use it

A codebase where a result is named by what it is rather than by where it came from, and where two values of one type
in a scope are rare enough to name by hand.
