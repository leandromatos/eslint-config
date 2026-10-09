import { builtinModules } from 'node:module'

/** Every file `recommended` reads as code: JavaScript and TypeScript of every module kind. */
export const JS_FILES = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}']

/** The files the type-checked layer reads. */
export const TS_FILES = ['**/*.{ts,tsx,mts,cts}']

/** The files the React layer reads. */
export const TSX_FILES = ['**/*.tsx']

/** The files the JSON layer reads. */
export const JSON_FILES = ['**/*.{json,jsonc,json5}']

/** The files the Markdown layer reads. */
export const MARKDOWN_FILES = ['**/*.md']

/**
 * What every project ignores: what a build wrote and what a coverage run wrote. Each carries a leading glob so a
 * monorepo is covered too: a bare name matches the root and nothing under a package.
 */
export const RECOMMENDED_IGNORES = ['**/coverage', '**/dist']

/**
 * The modules Node ships under a bare name, which a package of the same name shadows when the import carries no
 * protocol. Read from Node itself, so a module a later version adds is covered; the internal `_` modules and the
 * ones Node only answers under `node:` are left out.
 */
const NODE_BUILTINS = builtinModules.filter(name => !name.startsWith('_') && !name.includes(':') && !name.includes('/'))

/**
 * The constructs `recommended` refuses with a selector, because ESLint already carries the mechanism: an `enum`, a
 * builtin imported without its protocol, and a catch that answers every failure with one value.
 */
export const RECOMMENDED_RESTRICTED_SYNTAX = [
  {
    selector: 'TSEnumDeclaration',
    message:
      'Declare a closed set of values as `const X = {...} as const` plus `type X = (typeof X)[keyof typeof X]`, never as an enum.',
  },
  {
    selector: `ImportDeclaration[source.value=/^(${NODE_BUILTINS.join('|')})$/]`,
    message: 'Import the builtin as `node:<name>`. Without the protocol, a package of that name takes its place.',
  },
  {
    selector:
      "CallExpression[callee.property.name='catch'] > ArrowFunctionExpression[body.type=/^(Literal|Identifier)$/]",
    message:
      'This catch answers every failure with one value. Await the call, catch the error, and narrow it to the one this code answers for.',
  },
]

/**
 * The branches `strict` refuses on top of those: a ternary, everywhere but as the direct child of a JSX expression,
 * and an `else`, which an early return replaces.
 */
export const STRICT_RESTRICTED_SYNTAX = [
  ...RECOMMENDED_RESTRICTED_SYNTAX,
  {
    selector: 'ConditionalExpression:not(JSXExpressionContainer > ConditionalExpression)',
    message: 'Return early instead of a ternary. Only a JSX child may choose between two elements with one.',
  },
  {
    selector: 'IfStatement[alternate]',
    message: 'Return early instead of an else.',
  },
]
