# ESLint Config

### Setup

Use yarn to install eslint and custom config:

```bash
yarn add --dev @leandromatos/eslint-config
```

Create a new `.eslintrc.js` file and export an object containing your settings:

```js
module.exports = {
  extends: ["@leandromatos/eslint-config"],
};
```

If you are working on project with Vue, create a new `.eslintrc.js` file and export an object containing your settings:

```js
module.exports = {
  extends: ["@leandromatos/eslint-config", "@leandromatos/eslint-config/vue"],
};
```

---

&copy; All rights reserved
