# eslint-plugin-leandromatos

Every rule this package writes, under one namespace.

One plugin rather than one per subject, because a namespace is global to a configuration: ESLint refuses a second
plugin registered under a name another already took, and a word as common as `testing` is a name another plugin
claims. The subject opens the name of the rule, which is what a configuration writes and what a report shows:
`leandromatos/architecture-known-suffix`.

## 📖 Rules

Every rule is on in `plugin.configs.recommended` and in every tier from `strict` up, but the two that read a file of
constants, `typescript-composed-constant` and `typescript-repeated-literal`: a tier turns them on for its files of
constants alone, in the entry `leandromatos/constants`.

🔧 Automatically fixable by the `--fix` command line option\
💭 Requires type information

### architecture

Where a file lives, what it is called, and what a layer exposes.

| Rule                                                                                     | Description                                                                                 | 🔧  | 💭  |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --- | --- |
| [`architecture-argument-passed-whole`](architecture/docs/rules/argument-passed-whole.md) | A named object is passed on whole, not a field of it.                                       |     |     |
| [`architecture-barrel-per-directory`](architecture/docs/rules/barrel-per-directory.md)   | A directory of source files has an index.ts; a module root has none.                        |     |     |
| [`architecture-effect-in-hook`](architecture/docs/rules/effect-in-hook.md)               | An effect is written in a hook of its own, never in the component that renders.             |     |     |
| [`architecture-import-boundaries`](architecture/docs/rules/import-boundaries.md)         | A file reaches another layer through its barrel, and its own layer directly.                |     |     |
| [`architecture-known-directory`](architecture/docs/rules/known-directory.md)             | A module holds only the directories the options name.                                       |     |     |
| [`architecture-known-suffix`](architecture/docs/rules/known-suffix.md)                   | A file is named by a known suffix and lives in the folder of that suffix.                   |     |     |
| [`architecture-method-order`](architecture/docs/rules/method-order.md)                   | A class in an ordered layer lists its public methods alphabetically, then its private ones. | 🔧  |     |
| [`architecture-mirrored-source`](architecture/docs/rules/mirrored-source.md)             | A file under a mirror folder mirrors an existing file.                                      |     |     |
| [`architecture-one-export-per-util`](architecture/docs/rules/one-export-per-util.md)     | A utility file named after a function exports that function alone.                          |     |     |
| [`architecture-stepdown-order`](architecture/docs/rules/stepdown-order.md)               | A top-level function comes after its callers, in the order they call it.                    |     |     |
| [`architecture-type-suffix`](architecture/docs/rules/type-suffix.md)                     | An exported type that uses a governed suffix uses it last, and in the folder it belongs to. |     |     |
| [`architecture-types-folder`](architecture/docs/rules/types-folder.md)                   | An interface or a type alias is declared under the types folder.                            |     |     |

### naming

What a value, a method and a spec fixture are called.

| Rule                                                             | Description                                                                          | 🔧  | 💭  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | --- | --- |
| [`naming-expected-prefix`](naming/docs/rules/expected-prefix.md) | A variable an assertion compares against is named expected*.                         | 🔧  |     |
| [`naming-forbidden-name`](naming/docs/rules/forbidden-name.md)   | A name the options forbid, or a name carrying a word they forbid, is never declared. |     |     |
| [`naming-method-resource`](naming/docs/rules/method-resource.md) | A public method of a layer class carries the resource of its file in its name.       |     |     |
| [`naming-result-by-verb`](naming/docs/rules/result-by-verb.md)   | A variable holding what a producing verb returned opens with its participle.         | 🔧  |     |
| [`naming-value-case`](naming/docs/rules/value-case.md)           | A string value declared under a governed name keeps the casing that name promises.   |     |     |

### testing

How a spec is written and where it sits.

| Rule                                                                 | Description                                                                   | 🔧  | 💭  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --- | --- |
| [`testing-describes-source`](testing/docs/rules/describes-source.md) | The outermost describe of a mirroring spec names the mirrored source.         |     |     |
| [`testing-e2e-over-http`](testing/docs/rules/e2e-over-http.md)       | A spec of the end-to-end kind imports the HTTP client.                        |     |     |
| [`testing-spec-blocks`](testing/docs/rules/spec-blocks.md)           | A test body has at most three blocks, separated by blank lines.               | 🔧  |     |
| [`testing-typed-fixture`](testing/docs/rules/typed-fixture.md)       | A fixture handed to the subject carries the type the subject declares for it. | 🔧  | 💭  |

### text

The strings a product ships.

| Rule                                                       | Description                                                                  | 🔧  | 💭  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- | --- | --- |
| [`text-string-pattern`](text/docs/rules/string-pattern.md) | A string handed to a known call matches the pattern the options give for it. |     |     |

### tsdoc

The comments of a file: their form, their presence and their tags.

| Rule                                                                     | Description                                                                                                        | 🔧  | 💭  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | --- | --- |
| [`tsdoc-comment-form`](tsdoc/docs/rules/comment-form.md)                 | A note is a line comment while it fits on one line and a block once it runs to a paragraph, wrapped at the column. | 🔧  |     |
| [`tsdoc-description-sentence`](tsdoc/docs/rules/description-sentence.md) | The description of a documented function and the text of its tags read as sentences.                               |     |     |
| [`tsdoc-documented-function`](tsdoc/docs/rules/documented-function.md)   | A method or a function a module declares carries a comment that says what its name cannot.                         |     |     |
| [`tsdoc-documented-type`](tsdoc/docs/rules/documented-type.md)           | A class, an interface or a type alias a module declares carries a comment that says what its name cannot.          |     |     |
| [`tsdoc-link-symbols`](tsdoc/docs/rules/link-symbols.md)                 | A symbol in scope is linked with {@link}, never set in backticks; a link resolves.                                 | 🔧  |     |
| [`tsdoc-param-tag`](tsdoc/docs/rules/param-tag.md)                       | A documented function lists every parameter in a @param, in order, once, with a description.                       |     |     |
| [`tsdoc-returns-tag`](tsdoc/docs/rules/returns-tag.md)                   | A documented function carries one @returns with a description when it hands a value back, and none otherwise.      |     | 💭  |
| [`tsdoc-throws-tag`](tsdoc/docs/rules/throws-tag.md)                     | A documented function carries a @throws tag for every exception type it constructs.                                | 🔧  |     |
| [`tsdoc-typeless-tag`](tsdoc/docs/rules/typeless-tag.md)                 | A @param or a @returns carries no type in braces.                                                                  | 🔧  |     |
| [`tsdoc-unread-tag`](tsdoc/docs/rules/unread-tag.md)                     | A comment carries no tag that nothing reads: @override always, and a release tag with no tool for it.              |     |     |

### typescript

How a vocabulary is declared, and how a file of constants is written.

| Rule                                                                               | Description                                                                                  | 🔧  | 💭  |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --- | --- |
| [`typescript-composed-constant`](typescript/docs/rules/composed-constant.md)       | An object or a list built from constants writes no value in place.                           |     |     |
| [`typescript-const-assertion-pair`](typescript/docs/rules/const-assertion-pair.md) | A vocabulary declared with `as const` carries the type derived from it, in the types folder. | 🔧  |     |
| [`typescript-repeated-literal`](typescript/docs/rules/repeated-literal.md)         | A string of a constant file is written once, and every other use reads the constant.         |     |     |

## ⚙️ Options

One object with a group per subject, and each rule reads the group of its own subject. Every field of a group is
required: a tier hands the rules its vocabulary whole, and `plugin.configs.recommended` carries the default one. What
each field means is on the rule that reads it. The two rules of a file of constants read no group: `composed-constant`
takes nothing, and `repeated-literal` takes the options of `sonarjs/no-duplicate-string`.

| Group          | Type                  | Judges                                                      |
| -------------- | --------------------- | ----------------------------------------------------------- |
| `architecture` | `ArchitectureOptions` | where a file lives, what it is called, what a layer exposes |
| `naming`       | `NamingOptions`       | what a value, a method and a spec fixture are called        |
| `testing`      | `TestingOptions`      | how a spec is written and where it sits                     |
| `text`         | `TextOptions`         | the strings a product ships                                 |
| `tsdoc`        | `TsdocOptions`        | the comments of a file: form, presence, tags                |
| `typescript`   | `TypescriptOptions`   | where a vocabulary is declared                              |

## 📂 Source root

A rule that reads where a file sits judges it against its source root: the outermost `src` directory between the
working directory and the file. `src/users/user.service.ts` is rooted at `src/`, and
`apps/api/src/users/user.service.ts` at `apps/api/src/`, so each package of a monorepo is judged under its own sources.
A module named `src` inside the sources stays a module, and a file with no `src` in its path is left alone.

The rules that ask for a comment read no location: a declaration is documented wherever it sits, so
`tsdoc-documented-function`, `tsdoc-documented-type` and `tsdoc-link-symbols` judge every file the configuration names.

The directory that holds the source root is the package. A rule that reads a manifest, such as
`architecture-barrel-per-directory`, reads the `package.json` of that package and not the one of the working
directory.

## 🚀 Quick Start

Every tier from `configs` wires the plugin. Taken alone, with every rule on but the two of a file of constants, and
the default vocabulary behind it:

```typescript
import { plugin } from '@leandromatos/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([{ files: ['src/**/*.ts'], extends: [plugin.configs.recommended] }])
```

To take one rule, register the plugin and name the rule with its options:

```typescript
import { DEFAULT_NAMING, plugin } from '@leandromatos/eslint-config'

export default [
  {
    files: ['src/**/*.ts'],
    plugins: { leandromatos: plugin },
    rules: { 'leandromatos/naming-value-case': ['error', { ...DEFAULT_NAMING, testFolder: '__tests__' }] },
  },
]
```
