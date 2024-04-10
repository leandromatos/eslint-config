# ESlint Config

> [!IMPORTANT]
>
> **This package's version, v3.x, works with ESLint v9.x. If you are using an older version of ESLint, please use the package's version v2.x..**
>

This is a custom and sharable ESLint configuration for TypeScript, JavaScript, and React projects. It includes the following packages:

- [@typescript-eslint/eslint-plugin](https://www.npmjs.com/package/@typescript-eslint/eslint-plugin)
- [@typescript-eslint/parser](https://www.npmjs.com/package/@typescript-eslint/parser)
- [eslint-config-prettier](https://www.npmjs.com/package/eslint-config-prettier)
- [eslint-plugin-import](https://www.npmjs.com/package/eslint-plugin-import)
- [eslint-plugin-jsx-a11y](https://www.npmjs.com/package/eslint-plugin-jsx-a11y)
- [eslint-plugin-prettier](https://www.npmjs.com/package/eslint-plugin-prettier)
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [eslint-plugin-react](https://www.npmjs.com/package/eslint-plugin-react)
- [eslint-plugin-simple-import-sort](https://www.npmjs.com/package/eslint-plugin-simple-import-sort)
- [eslint](https://www.npmjs.com/package/eslint)
- [prettier-plugin-tailwindcss](https://www.npmjs.com/package/prettier-plugin-tailwindcss)
- [prettier](https://www.npmjs.com/package/prettier)
- [typescript-eslint](https://www.npmjs.com/package/typescript-eslint)

## Usage

> [!NOTE]
>
> **It's crucial to note that you must install the `typescript` package, even in a project that uses only JavaScript. This is because ESLint leverages TypeScript to parse the code and provide more accurate error messages.**

1. Use yarn or another package manager to install the package. For example:

  ```bash
  yarn add --dev eslint typescript @leandromatos/eslint-config
  ```

2. Create a new `.eslint.config.js` file in the root of your project and add the following content:

  ```js
  import config from "@leandromatos/eslint-config"

  export default [
    ...config
  ]
  ```

3. If you want to override some rules, you can do so by adding new configuration objects to the array. For example:

  ```js
  import config from "@leandromatos/eslint-config"

  export default [
    ...config,
    {
      rules: {
        "no-unused-vars": "warn"
      }
    }
  ]
  ```

## License

This package is licensed under the MIT License. For more information, see the [LICENSE](LICENSE) file.
