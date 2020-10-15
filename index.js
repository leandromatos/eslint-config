module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 11,
    parser: 'babel-eslint',
    sourceType: 'module',
  },
  extends: ['prettier', 'plugin:prettier/recommended'],
  rules: {
    'class-methods-use-this': 0,
    'consistent-return': 0,
    'global-require': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-unresolved': 0,
    'no-console': process.env.ENVIROMENT === 'production' ? 'error' : 'off',
    'no-debugger': process.env.ENVIROMENT === 'production' ? 'error' : 'off',
    'no-new': 0,
    'no-param-reassign': 0,
    'no-plusplus': 0,
    'no-undef': 0,
    'no-underscore-dangle': 0,
    'no-unused-vars': 0,
    'no-useless-constructor': 0,
    'prefer-rest-params': 0,
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        prev: '*',
        next: 'return',
      },
    ],
    semi: [1, 'never'],
  },
}
