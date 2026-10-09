# leandromatos/typescript-repeated-literal

A string of a file of constants is written once, and every other use reads the constant.

A word written twice is two words that happen to agree: the day one of them changes, the lists that named it stop
agreeing, and nothing reports it. A configuration lists the same folder, suffix or kind in several places, and each
place is one more copy. `sonarjs/no-duplicate-string` leaves out a string shorter than ten characters or written without
a separator ([S1192](https://sonarsource.github.io/rspec/#/rspec/S1192/javascript)), which are exactly the words a
configuration lists, so this rule takes the same options, counts every string, and reads the files the configuration
points it at.

A string that names something rather than holding a value is left alone: the source of an import or an export, a key, a
type, a member of an enum, a directive. An empty string holds nothing to name. A field of a row of a table, an object a
list holds or a field of a map whose every field is an object or a call that builds one, is left alone too: what repeats
down a column, the `kind` of every control, is the shape of the table rather than a word written twice.

## Rule details

👎 Examples of **incorrect** code, in `src/configs/constants/nextjs.constant.ts`:

```typescript
export const NEXTJS_ROOT_CONTEXTS = ['app', 'components', 'storybook']

export const NEXTJS_SUFFIX_FREE_FOLDERS = ['app', 'components', 'storybook']
```

👍 Examples of **correct** code:

```typescript
export const REACT_FOLDER = { router: 'app', storybook: 'storybook' }

export const NEXTJS_SUFFIX_FREE_FOLDERS = [REACT_FOLDER.router, AGNOSTIC_SUFFIX_DICTIONARY.component, REACT_FOLDER.storybook]

export const NEXTJS_ROOT_CONTEXTS = [...NEXTJS_SUFFIX_FREE_FOLDERS, AGNOSTIC_SUFFIX_DICTIONARY.util]
```

## Options

The options of `sonarjs/no-duplicate-string`, in its shape. Which files the rule reads is the configuration's to say,
with `files`: every tier turns it on for `**/*.constant.ts` alone, in the entry `leandromatos/constants`.

| Option          | Type     | Default | What it decides                                    |
| --------------- | -------- | ------- | -------------------------------------------------- |
| `threshold`     | `number` | `2`     | how many times a string is written before a report |
| `ignoreStrings` | `string` | `''`    | the strings never reported, separated by commas    |

## Fixable

No. Which name the word takes, and where the constant lives, is the author's to decide.

## When not to use it

A file of constants that holds messages or other prose, where two strings agree by coincidence rather than by
meaning.
