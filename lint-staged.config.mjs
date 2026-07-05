/**
 * @type {import('lint-staged').Config}
 */
export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['eslint --fix', 'prettier --write'],
  '*.{json,jsonc,json5}': ['eslint --fix', 'prettier --write'],
  '*.{yml,yaml}': ['prettier --write'],
  '*.md': ['eslint --fix', 'prettier --write'],
}
