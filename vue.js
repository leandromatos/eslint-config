module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  parserOptions: {
    parser: "@babel/eslint-parser",
    requireConfigFile: false,
  },
  extends: [
    "plugin:vue/recommended",
    "plugin:prettier/recommended"
  ],
  plugins: ["vue", "simple-import-sort", "import"],
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
    "vue/attributes-order": "off",
    "vue/component-name-in-template-casing": [
      "error",
      "kebab-case",
      {
        registeredComponentsOnly: true,
        ignores: [],
      },
    ],
    "vue/html-indent": ["error", 2],
    "vue/max-attributes-per-line": "off",
    "vue/multi-word-component-names": "off",
    "vue/no-v-html": "off",
    "vue/html-self-closing": [
      "error",
      {
        html: {
          void: "always",
        },
      },
    ],
    "vue/multiline-html-element-content-newline": "off",
    "vue/singleline-html-element-content-newline": "off",
    "class-methods-use-this": 0,
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
};
