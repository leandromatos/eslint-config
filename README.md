# ESLint Config

Personal [ESLint](https://eslint.org) setup: a flat, type-aware configuration for TypeScript, React, JSON and Markdown, plus a plugin of rules of my own covering the language's own constructs, naming, documentation, structure, tests, and the strings a product ships.

## ✨ Features

- **One config, every project.** A single source of truth, so linting never drifts between repositories.
- **A few rules of its own of its own.** The base config bans `enum`, refuses a bare `fs` where `node:fs` is meant, and refuses a `catch` that answers every failure with one value.
- **Type-aware out of the box.** TypeScript rules that read the type-checker through `projectService`, catching what syntax cannot: floating promises, unsafe returns, deprecated APIs.
- **One plugin, one namespace.** `leandromatos`, grouped by subject inside: `architecture`, `naming`, `testing`, `tsdoc`, `text` and `typescript`. Each rule ships the mechanism and takes the vocabulary as options, so no rule knows any one project.
- **A tier per framework, the way the ecosystem names them.** `recommended` is what the ecosystem already wrote, `strict` adds every rule of this package with a vocabulary that reads no framework, and `nestjs`, `nextjs` and `expo` add the tree each one writes. A project takes the tier it is on and states only where it differs.
- **Import boundaries read from the path.** A rule that answers what a file may import from where it sits, so a layered project enforces its architecture without hand-written patterns.
- **Native flat config, ESM.** No `FlatCompat`, no compat shims. Written in TypeScript, published as `dist/`.
- **Typed.** Every export ships declarations, so a TypeScript config file gets a checked array instead of an implicit `any`.
- **Formatting is Prettier's job.** The config never formats; it switches off what would fight the formatter. Pairs with [@leandromatos/prettier-config](https://github.com/leandromatos/prettier-config).

## 🧭 How It Works

The tiers are a ladder, and each rung takes what the one below it takes. A project picks the rung that names its framework and passes what differs:

```plaintext
recommended   the rules the ecosystem already wrote, by file type
  └─ strict   plus every rule of this package, with a vocabulary that reads no framework
       ├─ nestjs   plus the layers a module is cut into, and the order a class walks down them
       ├─ nextjs   plus modules under a container, the App Router, and the catalogue
       └─ expo     plus the same tree, on the platform React Native gives it
```

Every tier is a function, and every one takes the same options object: a project states only where it differs, and the tier carries the rest down. So the folder rules and the import rules read one vocabulary and cannot disagree.

**The plugin** is rules with no vocabulary of their own. A rule knows the shape of a question, "does this file sit under the folder its suffix names?", and the options answer it for one project. Nothing here knows any product: a NestJS codebase turns them on with its folders, a React codebase with its own.

A project that wants the rules with the default vocabulary and nothing else takes the plugin without a tier:

```ts
import { plugin } from '@leandromatos/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([{ files: ['src/**/*.ts'], extends: [plugin.configs.recommended] }])
```

The type-aware layer uses typescript-eslint's `projectService`, which finds the nearest `tsconfig.json` on its own. So the type-checked rules need a `tsconfig.json` in your project; without one, the parser has no types to read. `typescript` is a peer dependency for that reason, even in a mostly-JavaScript project.

## 📦 Installation

```bash
pnpm add --save-dev eslint typescript @leandromatos/eslint-config
```

`eslint >= 10` and `typescript >= 5 < 7` are peer dependencies, so you bring your own. The upper bound on TypeScript tracks what typescript-eslint supports, since the type-aware layer runs through its parser. Node `>= 22.12.0` is required.

## 🚀 Quick Start

What the ecosystem already wrote, in an `eslint.config.mts`:

```ts
import type { Config } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const eslintConfig: Config[] = configs.recommended()

export default eslintConfig
```

Every rule that reads no framework, with the folders this project has at its root:

```ts
import type { Config } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const eslintConfig: Config[] = configs.strict({
  ignores: ['agents'],
  architecture: { rootContexts: ['config', 'shared'] },
})

export default eslintConfig
```

A project on a framework names its tier instead, and passes the same shape:

```ts
const eslintConfig: Config[] = configs.nestjs({ architecture: { rootContexts: ['database'] } })
```

Then run ESLint as usual, and Prettier separately for formatting:

```bash
pnpm exec eslint .
```

### Editor and lint-staged setup

Because formatting lives in Prettier and not ESLint, your editor and your pre-commit hook need both tools: Prettier to format, ESLint to fix defects. Skip this and formatting stops happening on save. `eslint --fix` does not format, so if Prettier is not wired up, nothing does. Nothing errors; the code just silently stops being formatted.

VSCode, with the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extensions (`.vscode/settings.json`). Format with Prettier on save, and run ESLint's fixes as a separate action:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

[lint-staged](https://github.com/lint-staged/lint-staged), in the same order. Fix, then format, so Prettier has the last word on the result:

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

Every tier is a function taking one options object, and every group of that object merges over the tier's own vocabulary. One object reaches every plugin, so the folder rules and the import rules cannot end up with different vocabularies.

| Tier                  | Takes                | Adds to the tier below                                                                             |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `configs.recommended` | `RecommendedOptions` | the rules the ecosystem already wrote, by file type                                                |
| `configs.strict`      | `StrictOptions`      | every rule of this package, the documentation rules, the comment rule and the cycle rule           |
| `configs.nestjs`      | `NestjsOptions`      | the layers a module is cut into, the order a class walks down them, and the Swagger and log shapes |
| `configs.nextjs`      | `NextjsOptions`      | modules under a container, the App Router tree, and what a tool writes into the repository         |
| `configs.expo`        | `ExpoOptions`        | the same tree on React Native, the native folders, and Jest as the test runner                     |

What `configs.strict` emits, in order:

| Layer                                                              | What it is                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `configs.recommended`                                              | the configuration below, every layer of it                                                                                     |
| `architecture`, `naming`, `testing`, `text`, `tsdoc`, `typescript` | every rule of this package, with the default vocabulary                                                                        |
| the documentation rules                                            | what `eslint-plugin-jsdoc` holds and this package does not: every parameter listed, `@returns` only where something comes back |
| the comment rule                                                   | `leandromatos/tsdoc-comment-form` on the root `*.mts` and `*.mjs`, which the type-aware layer never reaches                    |
| the cycle rule                                                     | `import-x/no-cycle`, everywhere but in a barrel, which re-exports its siblings by design, and inside the project only          |

[`src/configs`](src/configs/README.md) is the reference for what each tier emits and what each one takes. To see what a tier resolves to in your project, rather than reading this page, run [`@eslint/config-inspector`](https://github.com/eslint/config-inspector):

```bash
pnpm dlx @eslint/config-inspector
```

### The configuration

What `configs.recommended` is, and what `configs.strict` opens with. A stack of flat config objects, applied by file type:

| Layer        | Files                              | What it does                                                                                   |
| ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Base         | `.{js,jsx,mjs,cjs,ts,tsx,mts,cts}` | `@eslint/js` recommended plus rules of its own, `import-x`, `simple-import-sort`, `@stylistic` |
| Type-checked | `.{ts,tsx,mts,cts}`                | typescript-eslint `recommendedTypeChecked` with `projectService`                               |
| React        | `.tsx`                             | `eslint-plugin-react` and `eslint-plugin-react-hooks` flat configs, plus `jsx-a11y`            |
| JSON         | `.{json,jsonc,json5}`              | `eslint-plugin-jsonc` recommended                                                              |
| Markdown     | `.md`                              | `@eslint/markdown` structural rules                                                            |
| Prettier     | all                                | `eslint-config-prettier`, applied last                                                         |

The rules each layer sets are in [`src/configs/recommended.config.ts`](src/configs/recommended.config.ts), and [`src/configs`](src/configs/README.md) is the reference for both configurations. Three of them are this package's own, written as selectors rather than as rules of the plugin, because ESLint already carries the mechanism:

| What it refuses             | Why                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `enum`                      | it emits runtime code no transpiler can inline, and a `const enum` from one version of a dependency runs against another |
| a bare `fs`, `path`, `http` | without `node:`, a package of that name takes the builtin's place                                                        |
| `.catch(() => null)`        | one value answers every failure, so a broken connection and a refused credential leave the same trace, which is none     |

### The plugin

One plugin, [`eslint-plugin-leandromatos`](src/plugins/README.md), holding every rule. A namespace is global to a configuration and ESLint refuses a second plugin registered under a name another already took, so a word as common as `testing` is not a namespace to claim. The subject a rule is about is part of its name, so a configuration writes `leandromatos/architecture-known-suffix` and a report shows the same.

| Subject        | Rules | Judges                                                       | Reads                          |
| -------------- | ----- | ------------------------------------------------------------ | ------------------------------ |
| `typescript`   | 1     | the constructs of the language: how a vocabulary is declared | the suffix of a type file      |
| `naming`       | 5     | what a value, a method and a fixture are called              | word lists                     |
| `tsdoc`        | 4     | the comments of a file: form, presence, tags                 | a column, the test folder      |
| `architecture` | 12    | where a file lives, what it is called, what a layer exposes  | the project's vocabulary       |
| `testing`      | 4     | how a spec is written and where it sits                      | the test folder and its kinds  |
| `text`         | 1     | the strings the product ships                                | the patterns the brand decided |

A rule reads the group of its own subject and nothing else, so a project states one vocabulary per subject. One markdown page per rule sits under `src/plugins/<subject>/docs/rules/<rule>.md`, which is where `meta.docs.url` points, so the editor shows the link beside the report: what the rule enforces, why, what fails, what passes, whether it fixes, and when not to use it.

### The exports

There is no default export: a project names the tier it takes.

| Export                 | What it is                                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `configs`              | the five tiers: `recommended`, `strict`, `nestjs`, `nextjs`, `expo`                                                                       |
| `plugin`               | the plugin object, for a project that reaches the rules without a tier                                                                    |
| `Config`               | the type of one flat config entry, for annotating your own array                                                                          |
| the tier option types  | `RecommendedOptions`, `StrictOptions`, `NestjsOptions`, `NextjsOptions`, `ExpoOptions`, with every group documented for the editor        |
| the group option types | `ArchitectureOptions`, `NamingOptions`, `TestingOptions`, `TextOptions`, `TsdocOptions`, `TypescriptOptions` and what they are built from |
| the `DEFAULT_*` values | the default vocabulary a tier merges over, to spread and extend                                                                           |
| `SUFFIX_TO_FOLDER`     | the default map of layer suffix to folder, which every default that names a folder reads                                                  |
| `PERIOD`, `NO_PERIOD`  | the two string patterns a text rule is written with                                                                                       |

## ⚙️ Configuration

### Configuring a tier

Every group of the options merges over its own defaults, so a project writes only what differs from the defaults. What the defaults hold is the vocabulary: which suffix lives in which folder, what a mirror folder is, what a test kind is. It is declared once, here, rather than in every project.

The defaults are exported values, not buried ones: `SUFFIX_TO_FOLDER` and the `DEFAULT_*` groups live in [`src/configs/constants/defaults.constant.ts`](src/configs/constants/defaults.constant.ts) and come out of `@leandromatos/eslint-config`. [Changing what a tier does](#changing-what-a-tier-does) shows how to extend them.

```ts
import type { Config, NestjsOptions, StringPattern } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const STRING_PATTERNS: StringPattern[] = [
  { callee: 'this.logger.warn', mustNot: '\\.$', because: 'a log line reads as a line, not a sentence' },
]

const nestjsOptions: NestjsOptions = {
  ignores: ['agents'],
  naming: { resourceFreeStems: ['auth'] },
  architecture: { rootContexts: ['config', 'shared'] },
  text: { stringPatterns: STRING_PATTERNS },
}

const eslintConfig: Config[] = configs.nestjs(nestjsOptions)

export default eslintConfig
```

| Option         | Required | Default               | Description                                      |
| -------------- | -------- | --------------------- | ------------------------------------------------ |
| `files`        | No       | `['src/**/*.ts']`     | The files the rules judge                        |
| `ignores`      | No       | none                  | What the linter never reads, beyond the defaults |
| `architecture` | No       | the default layout    | Merged over the tier's architecture vocabulary   |
| `naming`       | No       | the default words     | Merged over the tier's naming vocabulary         |
| `testing`      | No       | the default test tree | Merged over the tier's testing vocabulary        |
| `text`         | No       | the tier's own shapes | Merged over the tier's text vocabulary           |
| `tsdoc`        | No       | column 120            | Merged over the tier's TSDoc vocabulary          |
| `typescript`   | No       | the `type` suffix     | Merged over `DEFAULT_TYPESCRIPT`                 |

`configs.recommended` takes `ignores` alone: the base layer judges every file a project holds rather than its sources, so the only thing to state is what the linter never reads.

Names no declaration carries live in the naming group, and this package forbids one: `data`, which says what a value is made of rather than what it is. A project that has to write a name a contract imposes passes its own list:

```ts
configs.strict({ naming: { forbiddenNames: [] } })
```

### The plugin on its own

A project that wants the rules and not a tier takes the plugin alone. Two ways, by how much of the vocabulary the project brings.

**The default vocabulary, whole.** The plugin's own configuration, reached the way ESLint documents:

```ts
import { plugin } from '@leandromatos/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([{ files: ['src/**/*.ts'], extends: [plugin.configs.recommended] }])
```

**One rule at a time.** The plugin object is exported for that:

```ts
import { plugin } from '@leandromatos/eslint-config'

export default [
  {
    files: ['src/**/*.ts'],
    plugins: { leandromatos: plugin },
    rules: { 'leandromatos/naming-value-case': ['error', namingOptions] },
  },
]
```

### Changing what a tier does

Three ways, narrowest first. Reach for the first that answers the question: the earlier ones keep one vocabulary, and the last one is the escape hatch.

**Pass an option.** Every group merges over the tier's own default, so a project states only what differs. That is the whole of the surface above.

**Extend a default.** The values a tier merges over are exported, so a project adds to the default vocabulary instead of retyping it. `SUFFIX_TO_FOLDER` is the map every folder name comes from, and `DEFAULT_ARCHITECTURE`, `DEFAULT_NAMING`, `DEFAULT_TSDOC`, `DEFAULT_TESTING`, `DEFAULT_TEXT` and `DEFAULT_TYPESCRIPT` are what each group starts from:

```ts
import { configs, DEFAULT_NAMING, SUFFIX_TO_FOLDER } from '@leandromatos/eslint-config'

export default configs.strict({
  // The default folders, plus the one this project owns.
  architecture: { suffixToFolder: { ...SUFFIX_TO_FOLDER, widget: 'widgets' } },
  // The default participles, plus the verbs of this domain.
  naming: { verbParticiples: { ...DEFAULT_NAMING.verbParticiples, enqueue: 'enqueued' } },
})
```

Spread them; never mutate them. Every project in one ESLint process shares the object.

**Override the result.** A tier returns an array of flat config entries, so what ESLint says about a shareable config applies: append your own entries, and the later one wins. That is how ESLint documents it. "You can override settings from the shareable config by adding them directly into your `eslint.config.js` file after importing the shareable config" ([Overriding settings](https://eslint.org/docs/latest/extend/shareable-configs#overriding-settings-from-shareable-configs)).

```ts
import type { Config } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const eslintConfig: Config[] = [
  ...configs.strict(strictOptions),
  // Anything from here wins over the tier.
  { files: ['scripts/**/*.ts'], rules: { 'leandromatos/architecture-barrel-per-directory': 'off' } },
]

export default eslintConfig
```

### A TypeScript config file

An `eslint.config.mts` that spreads the array and exports it directly can fail to type-check with TS2883, _the inferred type of 'default' cannot be named_. TypeScript infers that array from `typescript-eslint`, `eslint` and `@eslint/core`, and it will only write a type the project can name. Under pnpm those packages sit in `node_modules/.pnpm/<name>@<version>_<hash>/`, which has no name a consumer can write, so the inference has nowhere to land.

Annotate the array instead. `Config` comes from this package, which the project already names:

```ts
import type { Config, StrictOptions } from '@leandromatos/eslint-config'
import { configs } from '@leandromatos/eslint-config'

const strictOptions: StrictOptions = { ignores: ['coverage'] }

const eslintConfig: Config[] = configs.strict(strictOptions)

export default eslintConfig
```

The annotation is harmless everywhere else, so a project on `.mts` can write it from the start rather than waiting for the error.

`defineConfig` from `eslint/config` does not take `Config`. It reads an entry as `@eslint/core` describes one, and a rule of this package is typed as `typescript-eslint` describes one, so that it can read a TypeScript node and its own options. The two spell `languageOptions` differently and neither is wrong, so a project that wants `extends` wraps only the entry that uses it:

```ts
const eslintConfig: Config[] = [
  ...configs.nextjs(),
  ...defineConfig([{ files: ['src/**/*.tsx'], extends: [somePolicy] }]),
]
```

### A React project

The `nextjs` and `expo` tiers name what a Bulletproof tree needs, so a React project takes its tier without restating the layout.

| Default            | What it holds                                                 | Why                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `moduleContainers` | `features`, `libs`                                            | those hold modules rather than layers, so the layer starts one segment later: `features/devices/screens` is the module `devices` and the layer `screens` |
| `rootContexts`     | what sits at the root of the sources and answers to no module | `app`, `assets`, `storybook`, `styles`, `theme` on the web; the Expo tier names its own                                                                  |
| `suffixToFolder`   | plus `hook`, `screen`, `store`, `provider`, `query`, `key`    | the layers a React project writes, read from the projects that write them                                                                                |
| `effectHooks`      | `useEffect`, `useLayoutEffect`, `useInsertionEffect`          | what `architecture-effect-in-hook` keeps out of a component                                                                                              |

A project that writes effects in components today turns that last one off by naming no effect, and turns it back on a file at a time:

```ts
configs.nextjs({ architecture: { effectHooks: [] } })
```

### Import boundaries

Some projects organize code by layer: a `services` folder holding `*.service.ts`, an `entities` folder holding `*.entity.ts`, and an `index.ts` barrel in each. Once that convention holds, `architecture-import-boundaries` reads a file's own path and answers what it may import.

| From                                              | Import                                        | Verdict                             |
| ------------------------------------------------- | --------------------------------------------- | ----------------------------------- |
| `tokens.module.ts`, which carries no layer suffix | `@/authorizer/tokens/services`                | Allowed                             |
| `tokens.module.ts`                                | `@/authorizer/tokens/services/tokens.service` | Names a file of a layer             |
| `entities/token.entity.ts`                        | `@/authorizer/users/services`                 | Allowed                             |
| `entities/token.entity.ts`                        | `@/authorizer/users/services/users.service`   | Names a file of another layer       |
| `entities/token.entity.ts`                        | `@/authorizer/tokens/entities/session.entity` | Allowed                             |
| `entities/token.entity.ts`                        | `@/authorizer/tokens/entities`                | Its own barrel, which re-exports it |

That last row is the one that surprises people. A file cannot go through the barrel of the layer it lives in, because that barrel re-exports the file itself. `token.entity` → `index` → `token.entity` is a cycle. Siblings are reached directly instead, and only inside the caller's own layer directory: a direct `*.entity` import from a different directory is still blocked, which is the hole the barrel exists to close.

A barrel answers to none of it, since re-exporting its siblings is its job. `.ts` and `.tsx` are one population: a hook in a React project carries its suffix the same way a service does. With `testFolder` set, production code cannot import from it, while everything inside it can, since tests are never part of a production import graph.

The rule reads `suffixToFolder`, `alias` and `testFolder` from the `architecture` group, so the folder rules and the import rules cannot end up with different vocabularies. Its own page is [`architecture-import-boundaries`](src/plugins/architecture/docs/rules/import-boundaries.md).

Cycles are a separate question: `configs.strict` sets `import-x/no-cycle` on everything but a barrel, and the walk stops at the edge of the project. A cycle between two files of a dependency is not the project's to break.

Both halves of the import graph are configured by `recommended`, and neither is a default: the resolver, so an alias and an extensionless import resolve at all, and the extensions the plugin may open, so the walk does not stop at the first TypeScript file it reaches.

## 🏷️ Versioning

Semver, published to npm. Peers are `eslint >= 10` and `typescript >= 5 < 7`, on Node `>= 22.12.0`; an ESLint major that changes the flat config API ships as a major here too. A rule that starts reporting what it used to pass is a breaking change, and so is a renamed option. Snapshots publish to the `snapshot` dist-tag as `X.Y.Z-snapshot.YYYYMMDD.N`; stable releases go to `latest`.

## 🤝 Contributing

This repository follows [Conventional Commits](https://www.conventionalcommits.org). See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, releases, and local setup.

## 📄 License

This software is free and open source, released by Leandro Matos under the MIT License. See the [LICENSE](LICENSE) file for the full terms.
