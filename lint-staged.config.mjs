/**
 * @type {import('lint-staged').Config}
 */
export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': ['eslint --fix --no-warn-ignored', 'prettier --write', () => 'tsc --noEmit'],
  '*.{json,jsonc,json5}': ['eslint --fix --no-warn-ignored', 'prettier --write'],
  '*.{yml,yaml}': ['prettier --write'],
  '*.md': ['eslint --fix --no-warn-ignored', 'prettier --write'],
}
