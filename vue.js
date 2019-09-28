module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: "babel-eslint"
  },
  extends: ["prettier", "prettier/vue", "plugin:vue/recommended"],
  plugins: ["vue"],
  rules: {
    "vue/attributes-order": "off",
    "vue/component-name-in-template-casing": [
      "error",
      "kebab-case",
      {
        registeredComponentsOnly: true,
        ignores: []
      }
    ],
    "vue/html-indent": ["error", 2],
    "vue/max-attributes-per-line": "off",
    "vue/no-v-html": "off",
    "vue/html-self-closing": [
      "error",
      {
        html: {
          void: "always"
        }
      }
    ],
    "vue/multiline-html-element-content-newline": 0,
    "vue/singleline-html-element-content-newline": 2
  }
};
