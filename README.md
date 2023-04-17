# Eslint Config

### Note

With the v2.x, you don't need to install the custom [prettier-config](https://github.com/leandromatos/prettier-config). All the prettier rules were added to this eslint-config.

### Setup

Use yarn to install Eslint and custom config:

```sh
yarn add --dev eslint @leandromatos/eslint-config
```

Create a new `.eslintrc.js` file and export an object containing your settings:

```js
module.exports = {
  extends: ["@leandromatos/eslint-config"],
};
```

If you are working on a project that uses Vue, you also need to add the settings for Vue to the `.eslintrc.js` file:

```js
module.exports = {
  extends: ["@leandromatos/eslint-config", "@leandromatos/eslint-config/vue"],
};
```

---

&copy; All rights reserved
