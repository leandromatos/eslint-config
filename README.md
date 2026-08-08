# ESLint Config

Personal [ESLint](https://eslint.org) configuration: flat config, type-aware, and ESM, covering TypeScript, React, import sorting, JSON, and Markdown.

## ✨ Features

- **One config, every project** — a single source of truth for ESLint rules, so linting never drifts between repositories.
- **Type-aware out of the box** — TypeScript rules that read the type-checker through `projectService`, catching what syntactic analysis cannot: floating promises, unsafe returns, deprecated APIs.
- **Native flat config, ESM** — no `FlatCompat`, no compat shims, no build step. The published `src/index.js` is the config.
- **Typed** — publishes type declarations, so importing it from TypeScript gives you a checked `ConfigArray` instead of an implicit `any`.
- **Formatting is Prettier's job** — the config never formats; it turns off the style rules that would fight the formatter and leaves the rest to Prettier. Pairs with [@leandromatos/prettier-config](https://github.com/leandromatos/prettier-config).
- **Absolute, sorted imports** — `import-x` blocks relative parent imports; `simple-import-sort` keeps imports and exports ordered.
- **Import boundaries on request** — an optional layer that derives barrel-crossing rules from your folder structure, so layered projects enforce the same architecture without hand-writing the patterns.
- **Batteries for React, JSON, and Markdown** — React and Hooks rules on `.tsx`, structural linting for JSON, JSONC, and Markdown.

## 🧭 How It Works

ESLint resolves the package to the array of flat config objects it exports, and you spread that array into your own `eslint.config.mjs`. Each object targets a file type: base JS and TS rules on all source, type-aware rules on `.ts` and `.tsx`, React rules on `.tsx`, and structural rules on JSON and Markdown. `eslint-config-prettier` comes last and switches off every rule that would fight the formatter.

The type-aware layer uses typescript-eslint's `projectService`, which finds the nearest `tsconfig.json` on its own. So the type-checked rules need a `tsconfig.json` in your project; without one, the parser has no types to read. `typescript` is a peer dependency for this reason, even in mostly-JavaScript projects.

Formatting is deliberately absent. The config never runs Prettier; it only disables the ESLint rules that overlap with it. You run Prettier separately — in `lint-staged`, your editor, or CI — to format, and ESLint to catch defects.

## 📦 Installation

Install ESLint, TypeScript, and the config as dev dependencies:

```bash
yarn add --dev eslint typescript @leandromatos/eslint-config
```

`eslint >= 10` and `typescript >= 5 < 7` are peer dependencies, so you bring your own. The upper bound on TypeScript tracks the range typescript-eslint supports, since the type-aware layer runs through its parser.

Node `>= 22.12.0` is required.

## 🚀 Quick Start

Create an `eslint.config.mjs`:

```js
import config from '@leandromatos/eslint-config'

export default config
```

The type-aware rules need a `tsconfig.json` at your project root. Then run ESLint as usual:

```bash
yarn eslint .
```

For formatting, pair it with [@leandromatos/prettier-config](https://github.com/leandromatos/prettier-config) and run Prettier on its own.

### Editor and lint-staged setup

Because formatting lives in Prettier and not ESLint, your editor and your pre-commit hook need both tools: Prettier to format, ESLint to fix defects. Skip this and formatting stops happening on save: `eslint --fix` does not format, so if Prettier is not wired up, nothing does. Nothing errors; the code just silently stops being formatted.

VSCode, with the [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extensions (`.vscode/settings.json`) — format with Prettier on save, and run ESLint's fixes as a separate action:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

Setting `defaultFormatter` explicitly also avoids a real conflict: if another formatter runs on save, it formats differently from `prettier-config` and the two fight over the file.

[lint-staged](https://github.com/lint-staged/lint-staged) (`lint-staged.config.mjs`) — Prettier writes first, then ESLint fixes:

```js
export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['prettier --write', 'eslint --fix'],
  '*.{json,jsonc,json5}': ['prettier --write', 'eslint --fix'],
  '*.{yml,yaml}': ['prettier --write'],
  '*.md': ['prettier --write', 'eslint --fix'],
}
```

Running Prettier first and ESLint second keeps them out of each other's way: Prettier owns layout, ESLint owns everything else.

## 🧩 What's Included

The config is a stack of flat config objects, applied by file type:

| Layer        | Files                              | What it does                                                                        |
| ------------ | ---------------------------------- | ----------------------------------------------------------------------------------- |
| Base         | `.{js,jsx,mjs,cjs,ts,tsx,mts,cts}` | `@eslint/js` recommended plus custom rules, `import-x`, `simple-import-sort`        |
| Type-checked | `.{ts,tsx,mts,cts}`                | typescript-eslint `recommendedTypeChecked` with `projectService`                    |
| React        | `.tsx`                             | `eslint-plugin-react` and `eslint-plugin-react-hooks` flat configs, plus `jsx-a11y` |
| JSON         | `.{json,jsonc,json5}`              | `eslint-plugin-jsonc` recommended                                                   |
| Markdown     | `.md`                              | `@eslint/markdown` structural rules                                                 |
| Prettier     | all                                | `eslint-config-prettier` disables style rules, applied last                         |

The exact rules each layer sets are in [`src/index.js`](src/index.js).

The package also ships a second entry point, `@leandromatos/eslint-config/import-boundaries`, which is opt-in and not part of the default export. See [Import boundaries](#import-boundaries).

## ⚙️ Configuration

The config is an array; override or extend by appending your own flat config objects after it. Objects later in the array win:

```js
import config from '@leandromatos/eslint-config'

export default [
  ...config,
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
]
```

### Import boundaries

Some projects organize code by layer: a `services` folder holding `*.service.ts`, an `entities` folder holding `*.entity.ts`, and an `index.ts` barrel in each. Once that convention holds, the import rules that protect it are mechanical, and the `import-boundaries` entry point generates them from the folders on disk.

The entry point ships the mechanism, never the vocabulary. There is no default `suffixToFolder` map, because any default would be one framework's naming imposed on every project that installs the package. You declare which suffixes and folders your project uses, and the rules are derived from that:

```js
import config from '@leandromatos/eslint-config'
import importBoundaries from '@leandromatos/eslint-config/import-boundaries'

export default [
  ...config,
  { ignores: ['coverage', 'dist'] },
  // Reads `src` when ESLint loads the config, so the rules track the folders that exist.
  ...importBoundaries({
    suffixToFolder: { entity: 'entities', service: 'services' },
  }),
]
```

The base config has to come first: `import-boundaries` sets `import-x/no-cycle`, and the base config is what registers that plugin.

#### A NestJS example

NestJS projects are the case this was built for, because they are opinionated enough that the folder layout is already fixed. A module owns a folder per responsibility, and every file carries the suffix of the folder it lives in:

```text
src/
  app.module.ts
  authorizer/
    tokens/
      controllers/{index.ts,tokens.controller.ts}
      entities/{index.ts,token.entity.ts,session.entity.ts}
      services/{index.ts,tokens.service.ts}
      __tests__/tokens.service.spec.ts
      tokens.module.ts
```

Spell that out once and the boundaries follow:

```js
export default [
  ...config,
  { ignores: ['coverage', 'dist'] },
  ...importBoundaries({
    suffixToFolder: {
      cache: 'caches',
      controller: 'controllers',
      decorator: 'decorators',
      doc: 'docs',
      dto: 'dtos',
      entity: 'entities',
      factory: 'factories',
      guard: 'guards',
      mock: 'mocks',
      repository: 'repositories',
      schema: 'schemas',
      service: 'services',
      spec: '__tests__',
      type: 'types',
      util: 'utils',
    },
    // Folders that mirror the layout without being layers: `roles/types/entities`
    // holds `*.type.ts`, so it belongs to the `types` layer, not to `entities`.
    mirrorFolders: ['types', '__tests__', '__mocks__'],
    testFolder: '__tests__',
  }),
]
```

`tokens.module.ts` carries no layer suffix, so it reaches every layer through a barrel. `token.entity.ts` reaches `session.entity` directly and `@/authorizer/tokens/services` through its barrel. Nothing reaches `__tests__` except other tests.

Three rules fall out of the layout. Barrels themselves are exempt from all of them, since re-exporting siblings is their job.

| From                                 | Import                                        | Verdict                           |
| ------------------------------------ | --------------------------------------------- | --------------------------------- |
| `tokens.module.ts` (no layer suffix) | `@/authorizer/tokens/services`                | Allowed                           |
| `tokens.module.ts`                   | `@/authorizer/tokens/services/tokens.service` | Use barrel imports                |
| `entities/token.entity.ts`           | `@/authorizer/users/services`                 | Allowed                           |
| `entities/token.entity.ts`           | `@/authorizer/users/services/users.service`   | Cross-layer requires barrel       |
| `entities/token.entity.ts`           | `@/authorizer/tokens/entities/session.entity` | Allowed                           |
| `entities/token.entity.ts`           | `@/authorizer/tokens/entities`                | Same layer requires direct import |

That last row is the one that surprises people. A file cannot go through the barrel of the layer it lives in, because that barrel re-exports the file itself — `token.entity` → `index` → `token.entity` is a cycle. Siblings are reached directly instead, and only inside the caller's own layer directory: a direct `*.entity` import from a different directory is still blocked, which is the hole the barrel rule exists to close.

Absolute imports are required over relative ones, so `./services` is an error too. With `testFolder` set, production code cannot import from it, while everything inside it can, since tests are never part of a production import graph. That exemption keys off the folder, not the suffix, so a shared helper with no layer suffix counts as a test file and still reaches the tree it belongs to.

| Option           | Required | Default | Description                                                                                                                                     |
| ---------------- | -------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `suffixToFolder` | Yes      | —       | Map of layer suffix to the folder that holds it, such as `{ entity: 'entities' }`                                                               |
| `root`           | No       | `'src'` | Source directory to walk, relative to the ESLint working directory                                                                              |
| `alias`          | No       | `'@'`   | Path alias that maps to `root`                                                                                                                  |
| `mirrorFolders`  | No       | none    | Folders that mirror the layer structure without being layers — with `types` listed, `roles/types/entities` holds `*.type.ts`, not `*.entity.ts` |
| `testFolder`     | No       | none    | Folder holding tests; when set, production code cannot import from it and the matching layer is exempt                                          |
| `noCycle`        | No       | `true`  | Whether to add `import-x/no-cycle`                                                                                                              |

The walk happens when ESLint loads the config, not per file, so a folder added mid-session needs a restart. Both failure modes are explicit rather than silent: an empty `suffixToFolder` throws, and a `root` that does not exist throws with the resolved path instead of an `ENOENT` from inside the package.

## 🏷️ Versioning

Semver, published to npm. Peers are `eslint >= 10` and `typescript >= 5 < 7`, on Node `>= 22.12.0`; an ESLint major that changes the flat config API ships as a major here too. Snapshots publish to the `snapshot` dist-tag as `X.Y.Z-snapshot.YYYYMMDD.N`; stable releases go to `latest`.

## 🤝 Contributing

This repository follows [Conventional Commits](https://www.conventionalcommits.org). See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, releases, and local setup.

## 📄 License

This software is free and open source, released by Leandro Matos under the MIT License. See the [LICENSE](LICENSE) file for the full terms.
