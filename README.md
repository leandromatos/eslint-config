# ESlint Config

> [!IMPORTANT]
>
> **This package requires ESLint v9 or higher. For older ESLint versions, please use v2.x of this package.**

This is a custom and sharable ESLint configuration for TypeScript, JavaScript, React, Markdown, YAML, and JSON projects. It includes the following packages:

## Core ESLint Packages

- [eslint](https://www.npmjs.com/package/eslint) - The core ESLint linting engine
- [@eslint/js](https://www.npmjs.com/package/@eslint/js) - ESLint's built-in JavaScript rules and configurations
- [@eslint/eslintrc](https://www.npmjs.com/package/@eslint/eslintrc) - Compatibility utilities for ESLint configuration formats

## TypeScript Support

- [typescript](https://www.npmjs.com/package/typescript) - TypeScript compiler and language support
- [typescript-eslint](https://www.npmjs.com/package/typescript-eslint) - Monorepo for TypeScript ESLint tooling
- [@typescript-eslint/parser](https://www.npmjs.com/package/@typescript-eslint/parser) - ESLint parser for TypeScript code
- [@typescript-eslint/eslint-plugin](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin) - ESLint rules specific to TypeScript

## Code Formatting

- [prettier](https://www.npmjs.com/package/prettier) - Opinionated code formatter
- [eslint-plugin-prettier](https://www.npmjs.com/package/eslint-plugin-prettier) - Runs Prettier as an ESLint rule
- [eslint-config-prettier](https://www.npmjs.com/package/eslint-config-prettier) - Disables ESLint rules that conflict with Prettier
- [prettier-plugin-tailwindcss](https://www.npmjs.com/package/prettier-plugin-tailwindcss) - Prettier plugin for sorting Tailwind CSS classes

## Import Management

- [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import) - ESLint plugin for validating imports/exports
- [eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort) - Auto-sorts imports and exports

## React Support

- [eslint-plugin-react](https://www.npmjs.com/package/eslint-plugin-react) - ESLint rules for React components
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) - ESLint rules for React Hooks
- [eslint-plugin-jsx-a11y](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) - Accessibility linting for JSX elements

## Additional Linting

- [@eslint/markdown](https://www.npmjs.com/package/@eslint/markdown) - Official ESLint plugin for Markdown files; lints structure and extracts code blocks for separate linting
- [eslint-plugin-yml](https://www.npmjs.com/package/eslint-plugin-yml) - ESLint plugin for YAML files
- [eslint-plugin-jsonc](https://www.npmjs.com/package/eslint-plugin-jsonc) - ESLint plugin for JSON, JSONC and JSON5 files

## Installation

> [!NOTE]
>
> **It's crucial to note that you must install the `typescript` package, even in a project that uses only JavaScript. This is because ESLint leverages TypeScript to parse the code and provide more accurate error messages.**

Use your preferred package manager to install the ESLint configuration:

```bash
yarn add --dev eslint typescript @leandromatos/eslint-config
```

> You can use any package manager of your choice (npm, pnpm, bun, etc.)

## Configuration

Create a new `eslint.config.js` file in the root of your project and add the following content:

```js
const { config } = require('@leandromatos/eslint-config')

module.exports = [...config]
```

### ESM Projects

If you're using ES modules, create an `eslint.config.mjs` file instead:

```js
import { config } from '@leandromatos/eslint-config'

export default [...config]
```

## Customization

If you want to override or add additional rules, you can extend the configuration by adding new configuration objects to the array:

```js
const { config } = require('@leandromatos/eslint-config')

module.exports = [
  ...config,
  {
    rules: {
      'no-unused-vars': 'warn',
      'prefer-const': 'error',
    },
  },
]
```

### Project-specific Configuration

You can also apply different rules to specific file patterns:

```js
const { config } = require('@leandromatos/eslint-config')

module.exports = [
  ...config,
  {
    files: ['**/*.test.{js,ts,jsx,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
]
```

## Markdown Code Blocks

This config uses [@eslint/markdown](https://www.npmjs.com/package/@eslint/markdown) in two complementary ways:

1. **Structural linting of `.md` files** via `markdown.configs.recommended` — catches duplicate headings, missing alt text, broken link references, and other semantic issues.
2. **Code block extraction** via `markdown.configs.processor` — fenced JavaScript and TypeScript blocks (` ```js `, ` ```ts `, ` ```tsx `) are extracted into virtual files (e.g. `README.md/0_0.ts`) and linted with all your JavaScript/TypeScript rules.

### What works inside Markdown code blocks

| Rule category         | Status                     | Examples                                                                       |
| --------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| Syntactic / stylistic | Enforced                   | `func-style`, `arrow-body-style`, `simple-import-sort/imports`, `prefer-const` |
| Type-aware            | **Disabled**               | `@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-unsafe-*`    |
| Prettier formatting   | **Not applied via ESLint** | quotes, semicolons, line wrap, indentation                                     |

### Why type-aware rules are disabled in Markdown blocks

Type-aware rules require the TypeScript program to be loaded from your `tsconfig.json`. Virtual files extracted from Markdown are not part of any `tsconfig` — they exist only in memory at lint time. Asking the parser to type-check them would crash with `"file was not found in any of the provided project(s)"`.

This config applies `typescript-eslint`'s [`disableTypeChecked`](https://typescript-eslint.io/users/configs#disable-type-checked) preset to `**/*.md/**` so syntactic rules still run, but type-aware ones are silently skipped. This is the recommended pattern; type-aware checks on documentation snippets would be of low value anyway.

### Why Prettier doesn't format Markdown code blocks via ESLint

`eslint-plugin-prettier` does not process virtual files extracted by `@eslint/markdown`'s processor — this is an upstream limitation. To format code blocks (and the surrounding Markdown text) consistently with the rest of your codebase, run Prettier directly on `.md` files. Prettier has built-in Markdown support and reformats embedded code blocks using the appropriate parser (Babel for `\`\`\`js`, etc.).

The two tools operate on different layers and don't conflict:

- **ESLint** validates structure (`no-multiple-h1`, `heading-increment`) and lints code blocks (syntactic rules)
- **Prettier** formats text and reformats code block contents

### Recommended `lint-staged.config.mjs`

```js
/**
 * @type {import('lint-staged').Config}
 */
export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['eslint --fix'],
  '*.{json,jsonc,json5}': ['eslint --fix'],
  '*.{yml,yaml}': ['eslint --fix'],
  '*.md': ['prettier --write', 'eslint --fix'],
}
```

For `.md` files, `prettier --write` runs first to format the file and its embedded code blocks, then `eslint --fix` runs the structural Markdown rules and the syntactic rules on extracted code blocks.

### Sharing Prettier options with the Prettier CLI

The Prettier options used by the ESLint integration live inside the `prettier/prettier` rule and are **not** read by the Prettier CLI. To keep direct CLI runs (for `.md` files, scripts, or pre-commit hooks) consistent with what ESLint enforces, mirror the same options in a `.prettierrc.json` at your project root:

```json
{
  "arrowParens": "avoid",
  "printWidth": 120,
  "semi": false,
  "singleQuote": true,
  "overrides": [
    {
      "files": ["*.yml", "*.yaml"],
      "options": {
        "singleQuote": false
      }
    }
  ]
}
```

Without this file, `prettier --write` will use Prettier's defaults (double quotes, semicolons, 80-character lines) and produce diffs that conflict with the ESLint rule.

## License

This package is licensed under the MIT License. For more information, see the [LICENSE](LICENSE) file.
