# configs

The five tiers this package ships, named the way the ecosystem names them.

`recommended` is what every repository takes as it is: the rules the ecosystem already wrote, by file type, with
what fights the formatter switched off at the end. `strict` is all of that plus the rules of this package. `nestjs`,
`nextjs` and `expo` are all of `strict` over the vocabulary of the tree each framework writes.

Every tier is a function over one options object. A list or a map the project passes joins the default of the tier, a
function in its place answers the whole value, and anything else replaces it.

## 📖 Configurations

| Export                | Takes                | What it adds to the tier below                                                 |
| --------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `configs.recommended` | `RecommendedOptions` | the rules of the ecosystem, by file type                                       |
| `configs.strict`      | `StrictOptions`      | every rule of this package, and the entries below                              |
| `configs.nestjs`      | `NestjsOptions`      | the vocabulary of NestJS                                                       |
| `configs.nextjs`      | `NextjsOptions`      | the vocabulary of a React tree, the image component, the catalog kept out      |
| `configs.expo`        | `ExpoOptions`        | the vocabulary of a React tree on React Native, the globals of the test runner |

The rules live in the plugin, and [`src/plugins`](../plugins/README.md) is their reference.

### `recommended`

One entry per file type, in this order. The last entry to match a file wins, which is why the Prettier one closes the
stack.

| Layer        | Files                                  | What it turns on                                                                    |
| ------------ | -------------------------------------- | ----------------------------------------------------------------------------------- |
| Base         | `**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}` | `@eslint/js` recommended, `import-x`, `simple-import-sort`, `@stylistic`, selectors |
| Type-checked | `**/*.{ts,tsx,mts,cts}`                | typescript-eslint `recommendedTypeChecked`, reading types through `projectService`  |
| React        | `**/*.tsx`                             | `eslint-plugin-react`, `eslint-plugin-react-hooks`, `jsx-a11y`                      |
| JSON         | `**/*.{json,jsonc,json5}`              | `eslint-plugin-jsonc` recommended                                                   |
| Markdown     | `**/*.md`                              | `@eslint/markdown` structural rules                                                 |
| Prettier     | all                                    | `eslint-config-prettier`, then `curly` on `multi`                                   |

`RECOMMENDED_IGNORES` is what every project ignores on top of the defaults of ESLint: `**/coverage` and `**/dist`,
what a coverage run and a build write.

Three refusals are selectors, since ESLint already carries the mechanism:

| What it refuses             | Why                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `enum`                      | it emits runtime code no transpiler can inline                                                        |
| a bare `fs`, `path`, `http` | without `node:`, a package of that name takes the place of the builtin                                |
| `.catch(() => null)`        | one value answers every failure, so a broken connection and a refused credential leave the same trace |

### `strict`

In this order. The last entry to match a file wins, which is what lets a project append its own.

| Entry                         | What it holds                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `recommended`                 | every layer of it, with what the project adds to `ignores`                                          |
| `leandromatos/rules`          | every rule of the plugin, each reading the group of its own subject                                 |
| `tsdoc/syntax`                | every documentation comment parses as TSDoc, with its standard tags only                            |
| the comment rule              | `leandromatos/tsdoc-comment-form` on the configuration files at the root                            |
| `import-x/no-cycle`           | no cycle, everywhere but in a barrel, and inside the project only                                   |
| `leandromatos/casts`          | `consistent-type-assertions` on `never`, `no-non-null-assertion`, `no-explicit-any`, specs included |
| `leandromatos/unsafe-values`  | the five `no-unsafe-*` rules, outside a spec                                                        |
| `leandromatos/directives`     | a directive that turns a rule off says why, after `--`                                              |
| `leandromatos/control-flow`   | no `else`, no nested ternary, and no ternary but the direct child of a JSX expression               |
| `leandromatos/function-style` | `func-style` on `expression`, outside the `.tsx` files a component is declared in                   |
| `leandromatos/constants`      | `typescript-repeated-literal` and `typescript-composed-constant`, on `DEFAULT_CONSTANT_FILES` alone |

### The framework tiers

Each one is `strict` over a vocabulary of its own, so a project on a framework restates none of its layout.

| Tier     | Judges                                                    | Ignores on top of `recommended`                                                             |
| -------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `strict` | the `.ts` of every source root, and `scripts/`            | nothing more                                                                                |
| `nestjs` | the same                                                  | nothing more                                                                                |
| `nextjs` | the `.ts` and `.tsx` of every source root, and `scripts/` | `.next`, `next-env.d.ts`, `playwright-report`, `public`, `storybook-static`, `test-results` |
| `expo`   | the same, `modules/`, and `.rnstorybook/` with a catalog  | `.expo`, `android`, `ios`, `expo-env.d.ts`, `.rnstorybook/storybook.requires.ts`            |

A source root is `src/`, or the `src/` of a package one level under `apps/`, `libs/` or `packages/`.

`nextjs` adds two entries: `leandromatos/image-alt-text`, which asks the `Image` component for its alternative text
as an `<img>` is, and `leandromatos/nextjs-catalog`, which keeps the catalog and its stories out of the application
(`catalog: false` drops it). `expo` adds the image entry, `leandromatos/expo-runner` with the globals of Jest and the
ones only Vitest declares turned off (`runner: 'vitest'` drops it), and `leandromatos/expo-catalog`, which spares
`.rnstorybook/` the rules of the layout, since Storybook names its entry files (`catalog: false` drops it).

## ⚙️ Options

`recommended` takes `ignores` alone. Every other tier takes `StrictOptions`, and `nextjs` and `expo` add their own.

| Option         | Default                        | Description                                                  |
| -------------- | ------------------------------ | ------------------------------------------------------------ |
| `files`        | the tier's `*_FILES`           | the files the rules judge                                    |
| `ignores`      | the tier's `*_IGNORES`         | what the linter never reads                                  |
| `basePath`     | the repository                 | the package a tier reads, in a monorepo                      |
| `architecture` | the tier's `*_ARCHITECTURE`    | where a file lives, what it is called, what a layer exposes  |
| `naming`       | the tier's `*_NAMING`          | what a value, a method and a spec fixture are called         |
| `testing`      | the tier's `*_TESTING`         | how an end-to-end spec reaches the application               |
| `text`         | `DEFAULT_TEXT`                 | the strings the product ships                                |
| `tsdoc`        | `DEFAULT_TSDOC`                | the comments of a file                                       |
| `typescript`   | `DEFAULT_TYPESCRIPT`           | where a vocabulary is declared                               |
| `presets`      | none                           | the presets applied over the tier, before every other option |
| `catalog`      | `true`, in `nextjs` and `expo` | whether the project keeps a Storybook catalog                |
| `runner`       | `'jest'`, in `expo`            | the runner the unit tests run under                          |

A tier without its own value for a group reads the one of `strict`: `nestjs` reads `DEFAULT_TEXT`. A preset is applied
over the vocabulary of the tier before the options of the project, so a list the project passes joins both:
`configs.nestjs({ presets: [CONTROLLED_LANGUAGE], naming: { resourceFreeStems: ['auth'] } })`.

The `nestjs` tier names the roots a NestJS API keeps (`cache`, `config`, `database`, `storage`, `utils`, `types` and
`__tests__`) and the casing of its queues and jobs: a queue name and a cache namespace in `camelCase`, the segment of a
Redis key, and a job name in `kebab-case`, a field of the hash of its queue. It names the kinds of file whose values
carry the kind as their last word, in `NESTJS_VALUE_SUFFIXES`: a `doc`, an `example` and a `schema`. Each kind is held
by `@typescript-eslint/naming-convention`, applied with `files`: every value a `.example.ts` file exports ends in
`Example`, and no value another file exports carries the word. A function is free to, since the word is the object of
its verb.

The entries are `leandromatos/value-suffixes`, for every file but the ones of a kind, and one
`leandromatos/{kind}-values` for each kind.

## 🧩 The constants

Every field of every group of every tier is an exported constant, named after the tier and the field:
`DEFAULT_TEST_KINDS`, `NESTJS_ORDERED_SUFFIXES`, `NEXTJS_ROOT_CONTEXTS`, `EXPO_DEFINITION_TIME_DIRECTIVES`. A tier
object such as `NEXTJS_ARCHITECTURE` only composes them, and a field a framework tier does not change is the one of
`strict`. A project reads a constant by name to build a value of its own, and never mutates one, since every project
in an ESLint process shares it.

The words the lists are written with are defined once each:

| Constant                      | What it names                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `AGNOSTIC_SUFFIX_DICTIONARY`  | the suffixes any project writes, design patterns included, and their folders                        |
| `NESTJS_SUFFIX_DICTIONARY`    | the suffixes NestJS adds                                                                            |
| `REACT_SUFFIX_DICTIONARY`     | the suffixes a React tree adds, on the web and on React Native                                      |
| `SUFFIX_DICTIONARY`           | the union of the three                                                                              |
| `DEFAULT_TEST_KIND`           | the kinds of test a project may write                                                               |
| `NESTJS_LAYER`, `REACT_LAYER` | the layers a list of a tier names                                                                   |
| `REACT_FOLDER`                | the folders of a React tree that hold no layer: the router, the assets, the containers, the catalog |
| `CONTROLLED_LANGUAGE`         | the house voice, a `Preset`, with each of its lists as a constant of its own                        |
| `NESTJS_FOLDER`               | the folders at the root of a NestJS API that hold no layer: config, database, storage               |
| `PERIOD`, `NO_PERIOD`         | the two patterns a text rule names a sentence and a label with                                      |

## 🚀 Quick Start

```ts
import type { Config } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const eslintConfig: Config[] = configs.nextjs({ architecture: { rootContexts: ['config'] } })

export default eslintConfig
```
