# ESlint Config

> [!IMPORTANT]
>
> **This package requires ESLint v9 or higher. For older ESLint versions, please use v2.x of this package.**
>

This is a custom and sharable ESLint configuration for TypeScript, JavaScript, and React projects. It includes the following packages:

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

- [eslint-plugin-markdownlint](https://www.npmjs.com/package/eslint-plugin-markdownlint) - ESLint plugin for Markdown files

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
const { config } = require("@leandromatos/eslint-config")

module.exports = [
  ...config
]
```

### ESM Projects

If you're using ES modules, create an `eslint.config.mjs` file instead:

```js
import { config } from "@leandromatos/eslint-config"

export default [
  ...config
]
```

## Customization

If you want to override or add additional rules, you can extend the configuration by adding new configuration objects to the array:

```js
const { config } = require("@leandromatos/eslint-config")

module.exports = [
  ...config,
  {
    rules: {
      "no-unused-vars": "warn",
      "prefer-const": "error"
    }
  }
]
```

### Project-specific Configuration

You can also apply different rules to specific file patterns:

```js
const { config } = require("@leandromatos/eslint-config")

module.exports = [
  ...config,
  {
    files: ["**/*.test.{js,ts,jsx,tsx}"],
    rules: {
      "no-console": "off"
    }
  }
]
```

## License

This package is licensed under the MIT License. For more information, see the [LICENSE](LICENSE) file.
