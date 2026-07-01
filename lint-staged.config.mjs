/**
 * @type {import('lint-staged').Config}
 */
export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['prettier --write', 'eslint --fix'],
  '*.{json,jsonc,json5}': ['prettier --write', 'eslint --fix'],
  '*.{yml,yaml}': ['prettier --write'],
  '*.md': ['prettier --write', 'eslint --fix'],
}
