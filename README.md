# ESLint Config

Personal [ESLint](https://eslint.org) configuration: flat config, type-aware, and ESM, covering TypeScript, React, import sorting, JSON, and Markdown.

## ✨ Features

- **One config, every project** — a single source of truth for ESLint rules, so linting never drifts between repositories.
- **Type-aware out of the box** — TypeScript rules that read the type-checker through `projectService`, catching what syntactic analysis cannot: floating promises, unsafe returns, deprecated APIs.
- **Native flat config, ESM** — no `FlatCompat`, no compat shims, no build step. The published `index.js` is the config.
- **Formatting is Prettier's job** — the config never formats; it turns off the style rules that would fight the formatter and leaves the rest to Prettier. Pairs with [@leandromatos/prettier-config](https://github.com/leandromatos/prettier-config).
- **Absolute, sorted imports** — `import-x` blocks relative parent imports; `simple-import-sort` keeps imports and exports ordered.
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

`eslint >= 10` and `typescript >= 5` are peer dependencies, so you bring your own. This package requires ESLint 10; for ESLint 9 pin `3.0.0-rc.45` or earlier, and for older ESLint use `2.x`.

## 🚀 Quick Start

Create an `eslint.config.mjs` and spread the config:

```js
import config from '@leandromatos/eslint-config'

export default [
  ...config,
  {
    ignores: ['dist'],
  },
]
```

The type-aware rules need a `tsconfig.json` at your project root. Then run ESLint as usual:

```bash
yarn eslint .
```

For formatting, pair it with [@leandromatos/prettier-config](https://github.com/leandromatos/prettier-config) and run Prettier on its own.

### Editor and lint-staged setup

Because formatting lives in Prettier and not ESLint, your editor and your pre-commit hook need both tools: Prettier to format, ESLint to fix defects. Skip this and formatting stops happening on save — a silent regression if you are coming from v2, where `eslint --fix` also formatted through `eslint-plugin-prettier`. Nothing errors; the code just stops being formatted.

VSCode (`.vscode/settings.json`) — format with Prettier on save, and run ESLint's fixes as a separate action:

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

lint-staged (`lint-staged.config.mjs`) — Prettier writes first, then ESLint fixes:

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

### Notable rules

| Rule                                         | Setting                       | Description                                                  |
| -------------------------------------------- | ----------------------------- | ------------------------------------------------------------ |
| `no-restricted-imports`                      | error on relative imports     | Forces absolute imports with an `@` alias.                   |
| `func-style`                                 | `declaration`, arrows allowed | Named functions as declarations, arrows where you want them. |
| `padding-line-between-statements`            | blank line before `return`    | Consistent spacing around returns.                           |
| `@typescript-eslint/consistent-type-imports` | `separate-type-imports`       | Type-only imports use `import type`.                         |
| `arrow-body-style`                           | `as-needed`                   | No unnecessary arrow bodies.                                 |

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

## 🏷️ Versioning

Semver, published to npm. Peers are `eslint >= 10` and `typescript >= 5`; an ESLint major that changes the flat config API ships as a major here too. Snapshots publish as `X.Y.Z-snapshot.YYYYMMDD.N` to test a change before a stable release.

## 🤝 Contributing

Commits follow Conventional Commits, validated by [@leandromatos/commitlint-config](https://github.com/leandromatos/commitlint-config). Work on a `release/vMAJOR` branch and open a pull request. A release is a separate, explicit step: bump the version (the `snapshot-version-bump.sh` script for pre-releases), then push a `v*` tag, which the publish workflow picks up.

## 📄 License

This software is free and open source, released by Leandro Matos under the MIT License. See the [LICENSE](LICENSE) file for the full terms.
