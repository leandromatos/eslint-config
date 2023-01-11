module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    parser: "@babel/eslint-parser",
    requireConfigFile: false,
  },
  extends: ["prettier", "plugin:prettier/recommended", "plugin:vue/recommended"],
  plugins: ["vue"],
  rules: {
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
  },
};
