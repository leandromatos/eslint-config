/**
 * @type {import('lint-staged').Config}
 */
export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['eslint --fix'],
  '*.{json,jsonc,json5}': ['eslint --fix'],
  '*.{yml,yaml}': ['eslint --fix'],
  '*.md': ['prettier --write', 'eslint --fix'],
}
