module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "standard",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/typescript",
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
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "class-methods-use-this": "off",
    "consistent-return": "off",
    "global-require": "off",
    "import/no-extraneous-dependencies": "off",
    "import/no-unresolved": "off",
    "no-console": process.env.ENVIRONMENT === "production" ? "error" : "off",
    "no-debugger": process.env.ENVIRONMENT === "production" ? "error" : "off",
    "no-new": "off",
    "no-param-reassign": "off",
    "no-plusplus": "off",
    "no-undef": "off",
    "no-underscore-dangle": "off",
    "no-useless-constructor": "warn",
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
};
