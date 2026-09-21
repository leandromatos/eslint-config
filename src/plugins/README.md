# eslint-plugin-leandromatos

Every rule this package writes, under one namespace.

One plugin rather than one per subject, because a namespace is global to a configuration: ESLint
refuses a second plugin registered under a name another already took, and a word as common as
`testing` is a name another plugin claims. The subject stays in the rule's own name, which is what
a configuration writes and what a report shows.

## 📖 Rules

💼 Set in the `recommended` configuration\
🔧 Automatically fixable by the `--fix` command line option\
💭 Requires type information

### architecture

where a file lives, what it is called, and what a layer exposes.

| Rule                                                                                     | Description                                                                                 | 💼  | 🔧  | 💭  |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --- | --- | --- |
| [`architecture/argument-passed-whole`](architecture/docs/rules/argument-passed-whole.md) | A named object is passed on whole, not a field of it.                                       | ✅  |     |     |
| [`architecture/barrel-per-directory`](architecture/docs/rules/barrel-per-directory.md)   | A directory of source files has an index.ts; a module root has none.                        | ✅  |     |     |
| [`architecture/effect-in-hook`](architecture/docs/rules/effect-in-hook.md)               | An effect is written in a hook of its own, never in the component that renders.             | ✅  |     |     |
| [`architecture/import-boundaries`](architecture/docs/rules/import-boundaries.md)         | A file reaches another layer through its barrel, and its own layer directly.                | ✅  |     |     |
| [`architecture/known-directory`](architecture/docs/rules/known-directory.md)             | A module holds only the directories the options name.                                       | ✅  |     |     |
| [`architecture/known-suffix`](architecture/docs/rules/known-suffix.md)                   | A file is named by a known suffix and lives in the folder of that suffix.                   | ✅  |     |     |
| [`architecture/method-order`](architecture/docs/rules/method-order.md)                   | A class in an ordered layer lists its public methods alphabetically, then its private ones. | ✅  | 🔧  |     |
| [`architecture/mirrored-source`](architecture/docs/rules/mirrored-source.md)             | A file under a mirror folder mirrors an existing file.                                      | ✅  |     |     |
| [`architecture/one-export-per-util`](architecture/docs/rules/one-export-per-util.md)     | A utility file named after a function exports that function alone.                          | ✅  |     |     |
| [`architecture/stepdown-order`](architecture/docs/rules/stepdown-order.md)               | A top-level function comes after its callers, in the order they call it.                    | ✅  |     |     |
| [`architecture/type-suffix`](architecture/docs/rules/type-suffix.md)                     | An exported type that uses a governed suffix uses it last, and in the folder it belongs to. | ✅  |     |     |
| [`architecture/types-folder`](architecture/docs/rules/types-folder.md)                   | An interface or a type alias is declared under the types folder.                            | ✅  |     |     |

### naming

what a value, a method and a spec fixture are called.

| Rule                                                             | Description                                                                        | 💼  | 🔧  | 💭  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --- | --- | --- |
| [`naming/expected-prefix`](naming/docs/rules/expected-prefix.md) | A variable an assertion compares against is named expected*.                       | ✅  | 🔧  |     |
| [`naming/forbidden-name`](naming/docs/rules/forbidden-name.md)   | A name the conventions forbid is never declared.                                   | ✅  |     |     |
| [`naming/method-resource`](naming/docs/rules/method-resource.md) | A public method of a layer class carries the resource of its file in its name.     | ✅  |     |     |
| [`naming/result-by-verb`](naming/docs/rules/result-by-verb.md)   | A variable holding what a producing verb returned opens with its participle.       | ✅  | 🔧  |     |
| [`naming/value-case`](naming/docs/rules/value-case.md)           | A string value declared under a governed name keeps the casing that name promises. | ✅  |     |     |

### testing

how a spec is written and where it sits.

| Rule                                                                 | Description                                                                   | 💼  | 🔧  | 💭  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --- | --- | --- |
| [`testing/describes-source`](testing/docs/rules/describes-source.md) | The outermost describe of a mirroring spec names the mirrored source.         | ✅  |     |     |
| [`testing/e2e-over-http`](testing/docs/rules/e2e-over-http.md)       | A spec of the end-to-end kind imports the HTTP client.                        | ✅  |     |     |
| [`testing/spec-blocks`](testing/docs/rules/spec-blocks.md)           | A test body has at most three blocks, separated by blank lines.               | ✅  | 🔧  |     |
| [`testing/typed-fixture`](testing/docs/rules/typed-fixture.md)       | A fixture handed to the subject carries the type the subject declares for it. | ✅  | 🔧  | 💭  |

### text

the strings the product ships.

| Rule                                                       | Description                                                                  | 💼  | 🔧  | 💭  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- | --- | --- | --- |
| [`text/string-pattern`](text/docs/rules/string-pattern.md) | A string handed to a known call matches the pattern the options give for it. | ✅  |     |     |

### tsdoc

the comments of a file: their form, their presence and their tags.

| Rule                                                         | Description                                                                            | 💼  | 🔧  | 💭  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------- | --- | --- | --- |
| [`tsdoc/comment-form`](tsdoc/docs/rules/comment-form.md)     | A note that runs to a paragraph is a block comment, wrapped at the configured column.  | ✅  | 🔧  |     |
| [`tsdoc/link-symbols`](tsdoc/docs/rules/link-symbols.md)     | A symbol in scope is linked with {@link}, never set in backticks; a link resolves.     | ✅  | 🔧  |     |
| [`tsdoc/public-surface`](tsdoc/docs/rules/public-surface.md) | A public method or exported function carries a comment that says what its name cannot. | ✅  |     | 💭  |
| [`tsdoc/throws-tag`](tsdoc/docs/rules/throws-tag.md)         | A documented function carries a @throws tag for every exception type it constructs.    | ✅  | 🔧  |     |

### typescript

the constructs of the language itself.

| Rule                                                                               | Description                                                                                  | 💼  | 🔧  | 💭  |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --- | --- | --- |
| [`typescript/const-assertion-pair`](typescript/docs/rules/const-assertion-pair.md) | A vocabulary declared with `as const` carries the type derived from it, in the types folder. | ✅  | 🔧  |     |

## ⚙️ Options

One object with a group per subject, and each rule reads the group of its own. Every field of a
group is required, because the factory carries no defaults: the defaults are in `strict`.
What each field means is on the rule that reads it.

| Group          | Type                  | Judges                                                      |
| -------------- | --------------------- | ----------------------------------------------------------- |
| `architecture` | `ArchitectureOptions` | where a file lives, what it is called, what a layer exposes |
| `naming`       | `NamingOptions`       | what a value, a method and a spec fixture are called        |
| `testing`      | `TestingOptions`      | how a spec is written and where it sits                     |
| `text`         | `TextOptions`         | the strings the product ships                               |
| `tsdoc`        | `TsdocOptions`        | the comments of a file: form, presence, tags                |
| `typescript`   | `TypescriptOptions`   | the constructs of the language itself                       |

## 🚀 Quick Start

Every tier from `configs` wires this for you. Taking the plugin alone, with every rule on and the
default vocabulary behind it:

```typescript
import { plugin } from '@leandromatos/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([{ files: ['src/**/*.ts'], extends: [plugin.configs.recommended] }])
```

`extends` is what ESLint reads a configuration from, and `defineConfig` is what makes it work: an
array exported without it is read as an eslintrc file and refused.

To pick one rule instead, register the plugin and name it:

```typescript
import { plugin } from '@leandromatos/eslint-config'

export default [
  {
    files: ['src/**/*.ts'],
    plugins: { leandromatos: plugin },
    rules: { 'leandromatos/naming-value-case': ['error', namingOptions] },
  },
]
```
