# ESLint Config

A flat, type-aware [ESLint](https://eslint.org) configuration for TypeScript, React, JSON and Markdown, in tiers, with
a plugin that holds a project to its architecture, its naming, its tests and its documentation.

## ✨ Features

- **A tier per framework, the way the ecosystem names them.** `recommended` is what the ecosystem already wrote,
  `strict` adds every rule of this package with a vocabulary that reads no framework, and `nestjs`, `nextjs` and
  `expo` add the tree each one writes.
- **Every default is an exported constant.** Each field of each tier is a constant of its own, such as
  `NEXTJS_ROOT_CONTEXTS`, so a project extends a default by reading it rather than retyping it.
- **A list joins, a function edits.** A list or a map a project passes joins the default of the tier; a function in
  its place receives the default and answers the whole value, which is how an entry is removed.
- **One plugin, one namespace.** `leandromatos`, grouped by subject inside: `architecture`, `naming`, `testing`,
  `text`, `tsdoc` and `typescript`. Each rule carries the mechanism and takes the vocabulary as options.
- **Type-aware.** The TypeScript rules read the type-checker through `projectService`, which catches what syntax
  cannot: a floating promise, an unsafe return, a deprecated API.
- **No cast, no `any`, no ternary outside JSX, no `else`.** `strict` holds the sources to the shape the type-checker
  can check and a reader can follow.
- **Formatting is Prettier's job.** The configuration never formats; it switches off what would fight the formatter.
  It pairs with [@leandromatos/prettier-config](https://github.com/leandromatos/prettier-config).
- **Native flat config, ESM, typed.** No `FlatCompat`. Every export ships declarations, so a TypeScript configuration
  file gets a checked array.

## 🧭 How It Works

The tiers are a ladder, and each rung takes what the one below it takes:

```plaintext
recommended   the rules the ecosystem already wrote, by file type
  └─ strict   plus every rule of this package, with a vocabulary that reads no framework
       ├─ nestjs   plus the layers a module is cut into, and the order a class walks down them
       ├─ nextjs   plus modules under a container, the App Router, and the catalog
       └─ expo     plus the same tree, on the platform React Native gives it
```

Every tier is a function, and every one takes the same options object, so a field means the same thing whichever tier
a project is on. The folder rules and the import rules read one vocabulary, and cannot disagree.

The plugin holds rules with no vocabulary of their own. A rule knows the shape of a question, "does this file sit
under the folder its suffix names?", and the options answer it for one project.

The type-aware layer runs through the `projectService` of typescript-eslint, which finds the nearest
`tsconfig.json` on its own, so a project needs one. `typescript` is a peer dependency for that reason.

## 📦 Installation

```bash
pnpm add --save-dev eslint typescript @leandromatos/eslint-config
```

`eslint >= 10` and `typescript >= 5 < 7` are peer dependencies. The upper bound on TypeScript follows what
typescript-eslint supports. Node `>= 22.12.0` is required.

## 🚀 Quick Start

What the ecosystem already wrote, in an `eslint.config.mts`:

```ts
import type { Config } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const eslintConfig: Config[] = configs.recommended()

export default eslintConfig
```

Every rule that reads no framework, with the folders this project keeps at the root of its sources:

```ts
const eslintConfig: Config[] = configs.strict({ architecture: { rootContexts: ['config', 'shared'] } })
```

A project on a framework names its tier, and passes the same shape:

```ts
const eslintConfig: Config[] = configs.nestjs({ architecture: { rootContexts: ['factories'] } })
```

`rootContexts: ['factories']` joins the contexts the tier already names. Then run ESLint, and Prettier apart from it:

```bash
pnpm exec eslint .
```

### Editor and lint-staged

`eslint --fix` does not format, so the editor and the pre-commit hook run both tools: Prettier to format, ESLint to
fix defects. In VSCode, with the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extensions:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

In [lint-staged](https://github.com/lint-staged/lint-staged), fix first and format last, so Prettier has the final
word:

```js
export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{json,jsonc,json5}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{yml,yaml}': ['prettier --write'],
  '*.md': ['eslint --fix --no-warn-ignored', 'prettier --write'],
}
```

## 🧩 What's Included

### The tiers

| Tier                  | Takes                | Adds to the tier below                                                                        |
| --------------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `configs.recommended` | `RecommendedOptions` | the rules the ecosystem already wrote, by file type                                           |
| `configs.strict`      | `StrictOptions`      | every rule of this package, and the entries below                                             |
| `configs.nestjs`      | `NestjsOptions`      | the layers NestJS writes, the order a class walks down them, the request objects passed whole |
| `configs.nextjs`      | `NextjsOptions`      | the layers a React tree writes, modules under a container, the catalog kept out of the app    |
| `configs.expo`        | `ExpoOptions`        | the same tree on React Native, the native folders, and the globals of the test runner         |

What `configs.strict` adds to `recommended`:

| Entry                         | What it holds                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `leandromatos/rules`          | every rule of the plugin, each reading the group of its own subject                                     |
| `tsdoc/syntax`                | every documentation comment parses as TSDoc, with its standard tags only                                |
| the comment rule              | `leandromatos/tsdoc-comment-form` on the configuration files at the root, which no tier otherwise reads |
| `import-x/no-cycle`           | no cycle, everywhere but in a barrel, and inside the project only                                       |
| `leandromatos/casts`          | no cast, no non-null assertion, no `any` written by hand, specs included                                |
| `leandromatos/unsafe-values`  | no value typed `any` travels, outside a spec                                                            |
| `leandromatos/directives`     | a directive that turns a rule off says why, after `--`                                                  |
| `leandromatos/control-flow`   | no `else`, no nested ternary, and no ternary but the direct child of a JSX expression                   |
| `leandromatos/function-style` | every function an arrow, outside the `.tsx` files a component is declared in                            |
| `leandromatos/constants`      | every value of a file of constants written once, and every field of a composed value read by name       |

[`src/configs`](src/configs/README.md) is the reference for what each tier emits and takes. To see what a tier
resolves to in a project, run [`@eslint/config-inspector`](https://github.com/eslint/config-inspector):

```bash
pnpm dlx @eslint/config-inspector
```

### The base configuration

What `configs.recommended` is, and what every other tier opens with, by file type:

| Layer        | Files                              | What it does                                                                        |
| ------------ | ---------------------------------- | ----------------------------------------------------------------------------------- |
| Base         | `.{js,jsx,mjs,cjs,ts,tsx,mts,cts}` | `@eslint/js` recommended, `import-x`, `simple-import-sort`, `@stylistic`, selectors |
| Type-checked | `.{ts,tsx,mts,cts}`                | typescript-eslint `recommendedTypeChecked` with `projectService`                    |
| React        | `.tsx`                             | `eslint-plugin-react`, `eslint-plugin-react-hooks` and `jsx-a11y`                   |
| JSON         | `.{json,jsonc,json5}`              | `eslint-plugin-jsonc` recommended                                                   |
| Markdown     | `.md`                              | `@eslint/markdown` structural rules                                                 |
| Prettier     | all                                | `eslint-config-prettier`, then `curly` on `multi`, turned back on after it          |

Three refusals are selectors rather than rules of the plugin, because ESLint already carries the mechanism:

| What it refuses             | Why                                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `enum`                      | it emits runtime code no transpiler can inline                                                        |
| a bare `fs`, `path`, `http` | without `node:`, a package of that name takes the place of the builtin                                |
| `.catch(() => null)`        | one value answers every failure, so a broken connection and a refused credential leave the same trace |

`curly` is set to `multi` after `eslint-config-prettier`, which turns it off: a branch of one statement takes no
braces, and one of several takes them.

### The plugin

One plugin, documented in [`src/plugins`](src/plugins/README.md). The subject of a rule opens its name, so a
configuration writes `leandromatos/architecture-known-suffix` and a report shows the same.

| Subject        | Rules | Judges                                                           |
| -------------- | ----- | ---------------------------------------------------------------- |
| `architecture` | 12    | where a file lives, what it is called, what a layer exposes      |
| `naming`       | 5     | what a value, a method and a fixture are called                  |
| `testing`      | 4     | how a spec is written and where it sits                          |
| `text`         | 1     | the strings a product ships                                      |
| `tsdoc`        | 10    | the comments of a file: form, presence, tags                     |
| `typescript`   | 3     | how a vocabulary is declared, and how a constant file is written |

Each rule has a page under `src/plugins/<subject>/docs/rules/<rule>.md`, which `meta.docs.url` points at, so the
editor links it beside the report.

### The exports

There is no default export: a project names the tier it takes.

| Export                           | What it is                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `configs`                        | the five tiers                                                                                         |
| `plugin`                         | the plugin, for a project that reaches the rules without a tier                                        |
| `Config`                         | the type of one flat configuration entry                                                               |
| the option types                 | `RecommendedOptions`, `StrictOptions`, `NestjsOptions`, `NextjsOptions`, `ExpoOptions`, and each group |
| `DEFAULT_*`                      | every field of `strict`, one constant each, and `DEFAULT_ARCHITECTURE` and the other groups whole      |
| `NESTJS_*`, `NEXTJS_*`, `EXPO_*` | every field each framework tier changes, and its groups whole                                          |
| the suffix dictionary            | `AGNOSTIC_SUFFIX_DICTIONARY`, `NESTJS_SUFFIX_DICTIONARY`, `REACT_SUFFIX_DICTIONARY` and their union    |
| `CONTROLLED_LANGUAGE`            | the house voice, opt-in, and each of its lists as a constant of its own                                |
| `PERIOD`, `NO_PERIOD`            | the two string patterns a text rule is written with                                                    |

## ⚙️ Configuration

### Extending a default

A list or a map a project passes joins the default of the tier, each item once. A function in its place receives a
copy of the default and answers the whole value, which is how an entry is removed. Anything else replaces the default.

```ts
import type { Config } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const eslintConfig: Config[] = configs.nextjs({
  architecture: {
    // Joins the contexts of the tier.
    rootContexts: ['docs'],
    // Edits the kinds of the tier: every one but `smoke`.
    testKinds: kinds => kinds.filter(kind => kind !== 'smoke'),
  },
})

export default eslintConfig
```

Every field of every tier is an exported constant, named after the tier and the field, so a project that builds a
value of its own reads the default by name:

```ts
import { configs, NEXTJS_ROOT_CONTEXTS } from '@leandromatos/eslint-config'

// The roots of the tier with the one this project adds, read by the tier and by an entry of the project's own.
const ROOT_CONTEXTS = [...NEXTJS_ROOT_CONTEXTS, 'docs']

export default [
  ...configs.nextjs({ architecture: { rootContexts: () => ROOT_CONTEXTS } }),
  { files: ROOT_CONTEXTS.map(root => `src/${root}/**/*.tsx`), rules: { 'react/display-name': 'error' } },
]
```

A suffix no dictionary carries is named with the folder that holds it, so the configuration never guesses a plural:

```ts
configs.strict({ architecture: { suffixToFolder: { widget: 'widgets' }, suffixDictionary: { widget: 'widgets' } } })
```

### The options

| Option         | Default                                                 | Description                                                      |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| `files`        | `src/`, `{apps,libs,packages}/*/src/` and `scripts/`    | the files the rules judge                                        |
| `ignores`      | what a build, a coverage run and the tier's tools write | what the linter never reads                                      |
| `basePath`     | the repository                                          | the package a tier reads, in a monorepo                          |
| `architecture` | `DEFAULT_ARCHITECTURE`, or the tier's                   | the shape of the project, read by the folder and import rules    |
| `naming`       | `DEFAULT_NAMING`, or the tier's                         | what a value, a method and a fixture are called                  |
| `testing`      | the tier's HTTP client, when it has one                 | how an end-to-end spec reaches the application                   |
| `text`         | no pattern                                              | the strings the product ships                                    |
| `tsdoc`        | column 80, no tool for release tags                     | how a comment is written                                         |
| `typescript`   | the `type` suffix                                       | where a vocabulary is declared                                   |
| `presets`      | none                                                    | the presets applied over the tier, such as `CONTROLLED_LANGUAGE` |

The test folder and the test kinds are said once, in `architecture`, and every plugin that reads them is handed the
same value.

The rules that read where a file sits judge it against its source root: the outermost `src/` between the working
directory and the file. A file with no `src/` in its path is left alone by those rules.

`configs.nextjs` also takes `catalog` (false when the project keeps no Storybook), and `configs.expo` takes `catalog`
and `runner` (`jest` by default, the runner Expo ships a preset for, or `vitest`).

### The house voice

`CONTROLLED_LANGUAGE` is the voice of the house, taken on purpose rather than by a tier: no name that ends in `data`,
comments wrapped at column 120, the condition the fix of a throw writes for an internal error, and the shape of the
logs, the exception titles and the Swagger text of a NestJS service.

```ts
configs.nestjs({ presets: [CONTROLLED_LANGUAGE], naming: { resourceFreeStems: ['auth'] } })
```

A preset is applied over the tier before the options of the project, so a list the project passes joins both. A
project writes a preset of its own the same way, as a `Preset`.

### A tier per package

In a monorepo whose packages sit on different stacks, the root takes `configs.strict` once, and each package takes the
tier of its stack with `basePath`. The tier reads its globs under that package and leaves the layers of
`recommended` to the root.

```ts
const eslintConfig: Config[] = [
  ...configs.strict(),
  ...configs.nextjs({ basePath: 'packages/web' }),
  ...configs.expo({ basePath: 'packages/mobile' }),
]
```

### The plugin on its own

The default vocabulary, whole, the way ESLint documents a plugin's configuration:

```ts
import { plugin } from '@leandromatos/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([{ files: ['src/**/*.ts'], extends: [plugin.configs.recommended] }])
```

One rule at a time:

```ts
import { DEFAULT_NAMING, plugin } from '@leandromatos/eslint-config'

export default [
  {
    files: ['src/**/*.ts'],
    plugins: { leandromatos: plugin },
    rules: { 'leandromatos/naming-value-case': ['error', { ...DEFAULT_NAMING, testFolder: '__tests__' }] },
  },
]
```

### Overriding the result

A tier returns an array of flat configuration entries, so an entry appended after it wins, as ESLint documents for a
shareable configuration: "You can override settings from the shareable config by adding them directly into your
`eslint.config.js` file after importing the shareable config"
([Overriding settings](https://eslint.org/docs/latest/extend/shareable-configs#overriding-settings-from-shareable-configs)).

```ts
const eslintConfig: Config[] = [
  ...configs.strict(),
  { files: ['scripts/**/*.ts'], rules: { 'leandromatos/architecture-barrel-per-directory': 'off' } },
]
```

### A TypeScript configuration file

An `eslint.config.mts` that exports the array a tier answers can fail with TS2883, _the inferred type of 'default'
cannot be named_: TypeScript infers it from packages that, under pnpm, sit in a directory no consumer can name.
Annotate the array with `Config`, which this package exports:

```ts
const eslintConfig: Config[] = configs.strict()
```

`defineConfig` from `eslint/config` reads an entry as `@eslint/core` describes one, and a rule of this package is
typed as typescript-eslint describes one, so a project that wants `extends` wraps only the entry that uses it:

```ts
const eslintConfig: Config[] = [...configs.nextjs(), ...defineConfig([{ files: ['src/**/*.tsx'], extends: [policy] }])]
```

### Import boundaries

A project organized by layer keeps a `services` folder of `*.service.ts`, an `entities` folder of `*.entity.ts`, and
an `index.ts` barrel in each. `architecture-import-boundaries` reads the path of a file and answers what it may import:

| From                                              | Import                                      | Verdict                             |
| ------------------------------------------------- | ------------------------------------------- | ----------------------------------- |
| `tokens.module.ts`, which carries no layer suffix | `@/accounts/tokens/services`                | allowed                             |
| `tokens.module.ts`                                | `@/accounts/tokens/services/tokens.service` | names a file of a layer             |
| `entities/token.entity.ts`                        | `@/accounts/users/services`                 | allowed                             |
| `entities/token.entity.ts`                        | `@/accounts/users/services/users.service`   | names a file of another layer       |
| `entities/token.entity.ts`                        | `@/accounts/tokens/entities/session.entity` | allowed                             |
| `entities/token.entity.ts`                        | `@/accounts/tokens/entities`                | its own barrel, which re-exports it |

A file cannot reach the barrel of its own layer, which re-exports the file itself, so siblings are imported directly.
Production code never imports the test folder, the testing folder of a package or a story, since a production install
leaves them out. The rule reads `suffixToFolder`, `alias`, `testFolder`, `testingFolder`, `mockFolder` and
`developmentSuffixes` from `architecture`; its page is
[`architecture-import-boundaries`](src/plugins/architecture/docs/rules/import-boundaries.md).

## 🏷️ Versioning

Semver, published to npm. A rule that starts reporting what it used to pass is a breaking change, and so is a renamed
option or export. Snapshots publish to the `snapshot` dist-tag as `X.Y.Z-snapshot.YYYYMMDD.N`; stable releases go to
`latest`.

## 🤝 Contributing

This repository follows [Conventional Commits](https://www.conventionalcommits.org). See
[CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, the releases and the local setup.

## 📄 License

Free and open source, released by Leandro Matos under the MIT License. See [LICENSE](LICENSE).
