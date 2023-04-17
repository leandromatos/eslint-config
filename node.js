module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ["standard", "plugin:prettier/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "simple-import-sort", "import"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        arrowParens: "avoid",
        endOfLine: "auto",
        printWidth: 120,
        semi: false,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: "all",
        overrides: [
          {
            files: ["*.yml", "*.yaml"],
            options: {
              singleQuote: false,
            },
          },
        ],
      },
    ],
    "class-methods-use-this": 0,
    "consistent-return": 0,
    "global-require": 0,
    "import/no-extraneous-dependencies": 0,
    "import/no-unresolved": 0,
    "no-console": process.env.ENVIROMENT === "production" ? "error" : "off",
    "no-debugger": process.env.ENVIROMENT === "production" ? "error" : "off",
    "no-new": 0,
    "no-param-reassign": 0,
    "no-plusplus": 0,
    "no-undef": 0,
    "no-underscore-dangle": 0,
    "no-unused-vars": 0,
    "no-useless-constructor": 0,
    "prefer-rest-params": 0,
    "padding-line-between-statements": [
      "error",
      {
        blankLine: "always",
        prev: "*",
        next: "return",
      },
    ],
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
  settings: {
    "import/parsers": {
      [require.resolve("@typescript-eslint/parser")]: [".ts", ".tsx", ".d.ts"],
    },
  },
};
