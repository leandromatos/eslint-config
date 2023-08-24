module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    "standard",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "jsx-a11y", "@typescript-eslint", "simple-import-sort", "import"],
  settings: {
    react: {
      version: "detect",
    },
    "import/parsers": {
      [require.resolve("@typescript-eslint/parser")]: [".ts", ".tsx", ".d.ts"],
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
        plugins: ["prettier-plugin-tailwindcss"],
        tailwindFunctions: ['tv', 'clsx', 'cva', 'tw'],
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
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "jsx-a11y/alt-text": [
      "warn",
      {
        elements: ["img"],
        img: ["Image"],
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
