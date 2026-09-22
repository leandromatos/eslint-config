# configs

The five tiers this package ships, named the way the ecosystem names them.

`recommended` is what every repository takes as it is: the rules the ecosystem already wrote, by
file type, with the formatter's own switched off at the end. `strict` is all of that plus this
package's own rules and the documentation rules. `nestjs`, `nextjs` and `expo` are all of `strict`
plus the tree each framework writes.

Every tier is a function. A tier reads the project's vocabulary, and no default can guess it, so a
project passes what differs and the tier carries the rest down.

## 📖 Configurations

| Export                | Takes                | What it adds to the tier below                                                                 |
| --------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| `configs.recommended` | `RecommendedOptions` | the ecosystem's rules, by file type                                                            |
| `configs.strict`      | `StrictOptions`      | every rule of this package, the documentation rules, the comment rule, the cycle rule          |
| `configs.nestjs`      | `NestjsOptions`      | the layers a module is cut into, the order a class walks down them, the Swagger and log shapes |
| `configs.nextjs`      | `NextjsOptions`      | modules under a container, the App Router tree, the component rules, the catalogue             |
| `configs.expo`        | `ExpoOptions`        | the same tree on React Native, the native folders, and Jest as the test runner                 |

The rules themselves live in the plugin, and [`src/plugins`](../plugins/README.md) is their
reference. What a tier adds over `recommended` is turning them on with a vocabulary.

### `recommended`

One entry per file type, in this order. The last to match a file wins, which is why Prettier's
closes the stack.

| Layer        | Files                                  | What it turns on                                                                                        |
| ------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Base         | `**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}` | `@eslint/js` recommended, `import-x`, `simple-import-sort`, `@stylistic`, and the selectors below below |
| Type-checked | `**/*.{ts,tsx,mts,cts}`                | typescript-eslint `recommendedTypeChecked`, reading types through `projectService`                      |
| React        | `**/*.tsx`                             | `eslint-plugin-react`, `eslint-plugin-react-hooks`, `jsx-a11y`                                          |
| JSON         | `**/*.{json,jsonc,json5}`              | `eslint-plugin-jsonc` recommended                                                                       |
| Markdown     | `**/*.md`                              | `@eslint/markdown` structural rules                                                                     |
| Prettier     | all                                    | `eslint-config-prettier`, which switches off what would fight the formatter                             |

It also names what every project ignores, on top of ESLint's own defaults: `**/.claude`,
`**/coverage` and `**/dist`, which is what a build wrote, what a coverage run wrote, and what an
agent works in.

Three refusals are this package's own, written as selectors because ESLint already carries the
mechanism and a rule of the plugin would say the same thing twice.

| What it refuses             | Why                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `enum`                      | it emits runtime code no transpiler can inline, and a `const enum` from one version of a dependency runs against another |
| a bare `fs`, `path`, `http` | without `node:`, a package of that name takes the builtin's place                                                        |
| `.catch(() => null)`        | one value answers every failure, so a broken connection and a refused credential leave the same trace, which is none     |

### `strict`

In this order. The last entry to match a file wins, which is what lets a project append its own.

| Entry                   | What it is                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `recommended`           | every layer of it, with whatever the project added to `ignores`                                                       |
| the plugin              | every rule of `eslint-plugin-leandromatos`, each reading the group of its own subject                                 |
| the documentation rules | what `eslint-plugin-jsdoc` holds and this package does not                                                            |
| the comment rule        | `leandromatos/tsdoc-comment-form` on the root `*.mts` and `*.mjs`, which the type-aware layer never reaches           |
| the cycle rule          | `import-x/no-cycle`, everywhere but in a barrel, which re-exports its siblings by design, and inside the project only |

### The framework tiers

Each one calls `strict` with a vocabulary of its own, so a project on a framework restates none of
its layout.

| Tier     | Judges                                    | Ignores on top of the defaults                                                                                   |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `nestjs` | `src/**/*.ts`                             | nothing: the tier's vocabulary is the tree, not the build                                                        |
| `nextjs` | the sources and the root TypeScript files | `.next`, `lighthouse-report`, `next-env.d.ts`, `playwright-report`, `public`, `storybook-static`, `test-results` |
| `expo`   | the sources and the root TypeScript files | `.expo`, `android`, `ios`, `expo-env.d.ts`                                                                       |

`nextjs` adds two entries of its own: the component rules, which judge what a `.tsx` declares and
how, and the catalogue, which keeps a story and a component in step. `expo` adds one: Jest's
globals, because a React Native project's unit tests run on `jest-expo` rather than on Vitest.

## ⚙️ Options

`recommended` takes `ignores` alone. Every other tier takes the same shape, and every group merges
over the tier's own default, so a project states only where it differs.

| Option         | Required | Default              | Description                                                 |
| -------------- | -------- | -------------------- | ----------------------------------------------------------- |
| `files`        | No       | the tier's own       | The files the rules judge                                   |
| `ignores`      | No       | none                 | What the linter never reads, beyond the tier's own          |
| `architecture` | No       | the tier's own       | Where a file lives, what it is called, what a layer exposes |
| `naming`       | No       | the tier's own       | What a value, a method and a spec fixture are called        |
| `testing`      | No       | the tier's own       | How a spec is written and where it sits                     |
| `text`         | No       | the tier's own       | The strings the product ships                               |
| `tsdoc`        | No       | the tier's own       | The comments of a file: form, presence, tags                |
| `typescript`   | No       | `DEFAULT_TYPESCRIPT` | The constructs of the language itself                       |

## 🧩 The defaults

Exported values, not buried ones. A project spreads one to add to the default vocabulary rather than
retyping it, and never mutates one: every project in an ESLint process shares the object.

| Export                 | What it holds                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `SUFFIX_TO_FOLDER`     | the one place a folder name is written, which every default below reads               |
| `DEFAULT_ARCHITECTURE` | the folders, the mirror folders, the test kinds, the ordered layers                   |
| `DEFAULT_NAMING`       | the participles, the roles a spec names by, the names no declaration carries          |
| `DEFAULT_TESTING`      | the test kinds, and the client an end-to-end spec sends requests with                 |
| `DEFAULT_TEXT`         | the shapes the package gives a Swagger description, an exception title and a log line |
| `DEFAULT_TSDOC`        | the column a comment is wrapped at                                                    |
| `DEFAULT_TYPESCRIPT`   | the suffix a type file carries                                                        |
| `PERIOD`, `NO_PERIOD`  | the two patterns a text rule names a sentence and a label with                        |

## 🚀 Quick Start

The ecosystem's rules, as they are:

```ts
import { configs } from '@leandromatos/eslint-config'

export default configs.recommended()
```

All of that plus this package's own, with the project's vocabulary:

```ts
import type { StrictOptions } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const strictOptions: StrictOptions = { ignores: ['agents'] }

export default configs.strict(strictOptions)
```

A project on a framework names its tier and passes the same shape:

```ts
import { configs } from '@leandromatos/eslint-config'

export default configs.nextjs({ architecture: { rootContexts: ['config'] } })
```
