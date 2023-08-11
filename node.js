module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "standard",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "simple-import-sort", "import"],
  settings: {
    "import/parsers": {
      [require.resolve("@typescript-eslint/parser")]: [".ts", ".d.ts"],
    },
  },
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
    "consistent-return": 0,
    "global-require": 0,
    "import/no-extraneous-dependencies": 0,
    "import/no-unresolved": 0,
    "no-console": process.env.ENVIRONMENT === "production" ? "error" : "off",
    "no-debugger": process.env.ENVIRONMENT === "production" ? "error" : "off",
    "no-new": 0,
    "no-param-reassign": 0,
    "no-plusplus": 0,
    "no-undef": 0,
    "no-underscore-dangle": 0,
    "no-unused-vars": 'off',
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
    "@typescript-eslint/no-unused-vars": "error",
  },
};
